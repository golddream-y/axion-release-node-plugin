/**
 * @Author: erwin
 * @Date:   2018-08-25 20-08-61
 * @Last modified by:   erwin
 * @Last modified time: 2018-08-26 19-08-26
 */



'use strict';


const _ = require(`lodash`);
const Bluebird = require(`bluebird`);
const conventionalCommitsDetector = require(`conventional-commits-detector`);
const debug = require(`debug`);
const fs = require(`fs`);
const getSemverTagInfo = Bluebird.promisify(require(`git-semver-tags-info`));
const allSemverTag = Bluebird.promisify(require(`git-semver-tags`));
const rawCommitsStream = require(`git-raw-commits`);
const recommendedBump = Bluebird.promisify(require(`conventional-recommended-bump`));
const streamToArray = require(`stream-to-array`);
const path = require(`path`);
const semverIncrement = require(`shifted-semver-increment`);
const shell = require(`shelljs`);

module.exports = axionRelease;


const TEST_PKG_WORD = 'snapshots';

/**
 * 获取最后一个tag的版本号
 * @method getLastVersion
 * @param  {[type]}       tagInfo
 * @return {[type]}
 */
const getLastVersion = (tagInfo) => {
  let tagList = tagInfo.filter(item => item.isTag);
  debug('getLastVersion:', tagList);
  return {
    'latestTag': tagList[0]['tag'],
    'latestCommitIsTag': tagInfo[0]['isTag']
  };
};

/**
 * debug且返回值
 * @method debugAndReturn
 * @param  {[type]}       message
 * @param  {[type]}       value
 * @return {[type]}
 */
const debugAndReturn = (message, value) => {
  // console.log('log:', message, value);
  console.debug(message, typeof value === 'string' ? value : JSON.stringify(value));
  return value;
};

function axionRelease(packageOpts) {
  packageOpts = packageOpts || {};
  return getSemverTagInfo()
    .then(tagInfo => debugAndReturn(`last tag1`, getLastVersion(tagInfo)))
    .then(({
      latestTag,
      latestCommitIsTag
    }) => streamToArray(rawCommitsStream({
      from: latestTag
    })))
    .then(_.partial(_.map, _, value => value.toString()))
    .then(_.partial(debugAndReturn, `commit messages - %O`, _))
    .then(commits => {

      const config = {
        data: {
          commits,
        },
        pkg: JSON.parse(fs.readFileSync(path.join(process.cwd(), `package.json`))),
        options: {
          // scmToken: process.env.GITLAB_AUTH_TOKEN,
          insecureApi: process.env.GITLAB_INSECURE_API === `true`,
          preset: packageOpts.preset || conventionalCommitsDetector(commits),
        },
      };

      debug(`detected ${config.options.preset} commit convention`);

      config.options.preset = config.options.preset === `unknown` ?
        `angular` : config.options.preset;

      debug(`using ${config.options.preset} commit convention`);

      // 版本推算
      return recommendedBump({
          ignoreReverted: false,
          preset: config.options.preset
        })
        .then(recommendation => {
          console.debug(`recommended version bump is - %O`, recommendation.releaseType, config.data);

          if (recommendation.releaseType === undefined) {
            return debug(`no recommended release so skipping the other release steps`);
          }

          return getSemverTagInfo()
            .then(tagInfo => debugAndReturn(`last tag2`, getLastVersion(tagInfo)))
            // 根据语义规范计算下一版本
            .then(({
              latestTag,
              latestCommitIsTag
            }) => {
              const semverIncrementVersion = latestTag === '' ? `1.0.0` : semverIncrement(latestTag, recommendation.releaseType);
              console.log('semverIncrementVersion:', semverIncrementVersion);
              // 判断最后一次提交是否为tag行为，如果不是，则增加测试版本后缀
              if (latestCommitIsTag) {
                return semverIncrementVersion;
              } else {
                return semverIncrementVersion + '-' + TEST_PKG_WORD;
              }
            })
            .then(_.partial(debugAndReturn, `version to be released`, _))
            // .then(_.partial(_.set, config, `data.version`, _))
            // .then(config => shell.exec(`git tag ${config.data.version}`))
            .then(() => config.data.version);
        });
    });
}