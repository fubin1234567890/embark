# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.0.0-alpha.4](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.3...v5.0.0-alpha.4) (2019-12-12)


### Bug Fixes

* **@embark/geth:** only register console command if in dev mode; use endpoint; use dev account for regular txs that fix geths stuck tx issue ([5d53847](https://github.com/embark-framework/embark/commit/5d53847))





# [5.0.0-alpha.3](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.2...v5.0.0-alpha.3) (2019-12-06)

**Note:** Version bump only for package embark-geth





# [5.0.0-alpha.2](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.1...v5.0.0-alpha.2) (2019-12-05)


### Bug Fixes

* **@embark/whisper:** show message when geth port is already taken ([23f9a8c](https://github.com/embark-framework/embark/commit/23f9a8c))


### Features

* **@embark/embark-rpc-manager:** Add support for `eth_signTypedData_v3` ([c7ec49a](https://github.com/embark-framework/embark/commit/c7ec49a)), closes [#1850](https://github.com/embark-framework/embark/issues/1850) [#1850](https://github.com/embark-framework/embark/issues/1850)
* **@embark/plugins/geth:** bump min supported geth version from 1.8.14 to 1.9.7 ([25d0510](https://github.com/embark-framework/embark/commit/25d0510))





# [5.0.0-alpha.1](https://github.com/embark-framework/embark/compare/v5.0.0-alpha.0...v5.0.0-alpha.1) (2019-11-05)

**Note:** Version bump only for package embark-geth





# [5.0.0-alpha.0](https://github.com/embark-framework/embark/compare/v4.1.1...v5.0.0-alpha.0) (2019-10-28)


### Bug Fixes

* **@embark/geth:** fix version result not available ([9803507](https://github.com/embark-framework/embark/commit/9803507))


### Build System

* bump all packages' engines settings ([#1985](https://github.com/embark-framework/embark/issues/1985)) ([ed02cc8](https://github.com/embark-framework/embark/commit/ed02cc8))


### BREAKING CHANGES

* node: >=10.17.0 <12.0.0
npm: >=6.11.3
yarn: >=1.19.1

node v10.17.0 is the latest in the 10.x series and is still in the Active LTS
lifecycle. Embark is still not compatible with node's 12.x and 13.x
series (because of some dependencies), otherwise it would probably make sense
to bump our minimum supported node version all the way to the most recent 12.x
release.

npm v6.11.3 is the version that's bundled with node v10.17.0.

yarn v1.19.1 is the most recent version as of the time node v10.17.0 was
released.