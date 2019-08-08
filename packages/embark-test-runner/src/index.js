import { __ } from 'embark-i18n';
const async = require('async');
const Mocha = require('mocha');
const path = require('path');
import fs from 'fs';
const { dappPath, embarkPath, runCmd, timer } = require('embark-utils');
const assert = require('assert');
const Test = require('./test');
const {EmbarkSpec, EmbarkApiSpec} = require('./reporter');
const SolcTest = require('./solc_test');
import { COVERAGE_GAS_LIMIT, GAS_LIMIT } from './constants';
const Web3 = require('web3');

// TODO(andremedeiros): move to constants
const TEST_TIMEOUT = 15000; // 15 seconds in milliseconds

class TestRunner {
  constructor(embark, options) {
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;
    this.fs = embark.fs;
    this.ipc = options.ipc;
    this.runResults = [];
    this.gasLimit = options.coverage ? COVERAGE_GAS_LIMIT : GAS_LIMIT;

    this.events.setCommandHandler('tests:run', (options, callback) => {
      this.run(options, callback);
    });

    /*
    this.events.setCommandHandler('tests:results:reset', () => {
      this.runResults = [];
    });

    this.events.setCommandHandler('tests:results:get', (callback) => {
      callback(this.runResults);
    });


    this.events.setCommandHandler('tests:results:report', (test) => {
      this.runResults.push(test);
    });

    this.embark.registerAPICall(
      'post',
      '/embark-api/test',
      (req, res) => {
        const options = {file: req.body.files, solc: true, inProcess: true};
        this.run(options, () => res.send(this.runResults));
      }
    );
    */
  }

  run(options, cb) {
    const self = this;

    // config to connect to a vm
    // config to use specific or random accounts for vm
    // deploy contracts
    // get contract objects, and make them available in the tests
    // V run tests
    // get tests results/data

    // this.embark.config.blockchainConfig.type = 'vm';
    // TODO: we should just use `deploy:contracts`
    this.events.request('deploy:contracts:test', function (err) {
      console.dir("deployment done")

      return cb();
    });

    const testPath = options.file || "test";
    async.waterfall([
      (next) => { // list files in path
        self.getFilesFromDir(testPath, next);
      },
      (files, next) => { // group files by types
        const types = { jsFiles: ".js", solidityFiles: "_test.sol" };
        const groups = Object.entries(types).reduce((acc, [type, ext]) => {
          acc[type] = files.filter(f => f.endsWith(ext));
          return acc;
        }, {});

        next(null, groups);
      },
      (groups, next) => { // run tests
        let fns = [];

        if (!options.solc && groups.jsFiles.length > 0) {
          fns.push((cb) => self.runJSTests(groups.jsFiles, options, cb));
        } else if (options.solc && groups.solidityFiles.length > 0) {
          fns.push((cb) => self.runSolidityTests(groups.solidityFiles, options, cb));
        }

        if (fns.length === 0) {
          return next('No tests to run');
        }

        async.series(fns, next);
      },
      (results, next) => { // generate coverage report
        if (!options.coverage) {
          return next(null, results);
        }

        const cmd = [
          embarkPath('node_modules/.bin/istanbul'),
          "report",
          "--root=.embark",
          "--format=html",
          "--format=lcov"
        ].join(" ");

        runCmd(cmd, {silent: false, exitOnError: false}, (err) => {
          if (err) {
            return next(err);
          }

          self.logger.info(`Coverage report created. You can find it here: ${dappPath('coverage/index.html')}`);

          if (options.noBrowser) {
            return next(null, results);
          }

          const opn = require('opn');
          const _next = () => { next(null, results); };

          opn(dappPath('coverage/index.html'), {wait: false})
            .then(() => timer(1000))
            .then(_next, _next);

        });
      },
      (results, next) => { // show report
        const totalFailures = results.reduce((acc, result) => acc + result, 0);

        (totalFailures == 0)
          ? next(null, ' > All tests passed'.green.bold)
          : next(totalFailures, ` > Total number of failures: ${totalFailures}`.red.bold);
      }
    ], (err, msg) => {
      process.stdout.write(msg + "\n");

      self.fs.remove('.embark/contracts');
      self.fs.remove('.embark/remix_tests.sol');

      return cb(err);
    });
    // -------------------------------------------------------------------------------------------------------------

    /*
    const self = this;
    let filePath = options.file;
    if (!filePath) {
      filePath = 'test';
    }
    async.waterfall([
      function getFiles(next) {
        self.getFilesFromDir(filePath, next);
      },
      function groupFiles(files, next) {
        let jsFiles = files.filter((filename) => filename.substr(-3) === '.js');
        let solidityFiles = files.filter((filename) => filename.indexOf('_test.sol') > 0);
        next(null, {jsFiles, solidityFiles});
      },
      function runTests(files, next) {
        const fns = [];
        if (!options.solc && files.jsFiles.length > 0) {
          let fn = (callback) => {
            self.runJSTests(files.jsFiles, options, callback);
          };
          fns.push(fn);
        }
        if(files.solidityFiles.length > 0) {
          let fn = (callback) => {
            self.runSolidityTests(files.solidityFiles, options, callback);
          };
          fns.push(fn);
        }
        if(fns.length === 0){
          return next('No tests to run');
        }
        async.series(fns, next);
      },
      function runCoverage(results, next) {
        if (!options.coverage) {
          return next(null, results);
        }

        global.embark.events.emit('tests:finished', function() {
          runCmd(`${embarkPath('node_modules/.bin/istanbul')} report --root .embark --format html --format lcov`,
            {silent: false, exitOnError: false}, (err) => {
              if (err) {
                return next(err);
              }
              console.info(`Coverage report created. You can find it here: ${dappPath('coverage/index.html')}\n`);
              const opn = require('opn');
              const _next = () => { next(null, results); };
              if (options.noBrowser) {
                return next(null, results);
              }
              opn(dappPath('coverage/index.html'), {wait: false})
                .then(() => timer(1000))
                .then(_next, _next);
            });
        });
      }
    ], (err, results) => {
      if (err) {
        return cb(err);
      }
      self.fs.remove('.embark/contracts', (err) => {
        if(err) {
          console.error(__("Error deleting compiled contracts from .embark"), err);
        }
      });
      self.fs.remove('.embark/remix_tests.sol', (err) => {
        if(err) {
          console.error(__("Error deleting '.embark/remix_tests.sol'"), err);
        }
      });
      let totalFailures = results.reduce((acc, result) => acc + result.failures, 0);
      if (totalFailures) {
        return cb(` > Total number of failures: ${totalFailures}`.red.bold);
      }
      console.info(' > All tests passed'.green.bold);
      cb();
    });
  */
  }


  getFilesFromDir(filePath, cb) {
    const self = this;

    self.fs.stat(filePath, (err, fileStat) => {
      const errorMessage = `File "${filePath}" doesn't exist or you don't have permission to it`.red;
      if (err) {
        return cb(errorMessage);
      }
      let isDirectory = fileStat.isDirectory();
      if (isDirectory) {
        return self.fs.readdir(filePath, (err, files) => {
          if (err) {
            return cb(err);
          }
          async.map(files, (file, _cb) => {
            self.getFilesFromDir(path.join(filePath, file), _cb);
          }, (err, arr) => {
            if (err) {
              return cb(errorMessage);
            }
            cb(null, arr.reduce((a,b) => a.concat(b), []));
          });
        });
      }
      cb(null, [filePath]);
    });
  }

  executeTestFiile() {
    let embark = this.embark;
  }

  runJSTests(files, options, cb) {
    const {events} = this.embark;

    let accounts = [];
    let compiledContracts;
    let web3;

    const config = (cfg, acctCb) => {
      global.before((done) => {
        async.waterfall([
          (next) =>                              events.request("contracts:build", cfg, compiledContracts, next),
          (contractsList, contractDeps, next) => events.request("deployment:contracts:deploy", contractsList, contractDeps, next),
          (next) =>                              events.request("contracts:list", next),
          (contracts, next) => {
            for(const c of contracts) {
              const instance = new web3.eth.Contract(c.abiDefinition, c.deployedAddress);
              Object.setPrototypeOf(compiledContracts[c.className], instance);
            }
            next();
          }
        ], (_err) => {
            acctCb(accounts);
            done();
        });
      });
    };

    async.waterfall([
      (next) => { // request provider
        events.request("blockchain:client:provider", "ethereum", next);;
      },
      (bcProvider, next) => { // set provider
        web3 = new Web3(bcProvider);
        next();
      },
      (next) => { // get accounts
        web3.eth.getAccounts((accts) => {
          console.log('got accounts from web3');
          console.dir(accts);
          accounts = accts;
          next();
        });
      },
      (next) => { // get contract files
        console.log('getting contract files');
        events.request("config:contractsFiles", next);
      },
      (cf, next) => { // compile contracts
        console.log('compiling contracts');
        events.request("compiler:contracts:compile", cf, next);
      },
      (cc, next) => { // override require
        compiledContracts = cc;

        const Module = require("module");
        const originalRequire = require("module").prototype.require;
        Module.prototype.require = function(req) {
          const prefix = "Embark/contracts/";
          if (!req.startsWith(prefix)) {
            return originalRequire.apply(this, arguments);
          }

          return cc[req.replace(prefix, "")];
        };
        next();
      },
      (next) => { // setup global namespace
        const originalDescribe = global.describe;

        global.assert = assert;
        global.config = config;
        global.describe = (scenario, cb) => {
          originalDescribe(scenario, cb(accounts));
        };
        global.contract = global.describe;
        next();
      },
      (next) => { // initialize Mocha
        const mocha = new Mocha();

        mocha.suite.timeout(TEST_TIMEOUT);
        files.forEach(f => mocha.addFile(f));

        mocha.run((failures) => {
          next(null, failures);
        });
      },
    ], (err, failures) => {
      cb(err, failures);
    });
  }

  runSolidityTests(files, options, cb) {
    console.info('Running solc tests');

    let solcTest = new SolcTest({loglevel: options.loglevel, node: options.node, events: this.events, logger: this.logger,
      config: this.embark.config, ipc: this.ipc, coverage: options.coverage});
    global.embark = solcTest;
    async.waterfall([
      function initEngine(next) {
        solcTest.init(next);
      },
      function setupTests(next) {
        solcTest.setupTests(files, next);
      },
      function runTests(_reciepts ,cb) {
        let fns = files.map((file) => {
          return (cb) => {
            return solcTest.runTests(file, cb);
          };
        });
        async.series(fns, cb);
      }
    ], (err, results) => {
      if(err) return cb(err);
      let totalPass = 0;
      let totalFailures = 0;
      results.forEach((result) => {
        result.forEach((r) => {
          totalPass = totalPass + r.passingNum;
          totalFailures = totalFailures + r.failureNum;
        });
      });
      this.events.request('config:contractsFiles:reset', () => {
        cb(null, {failures: totalFailures, pass: totalPass});
      });
    });
  }
}

module.exports = TestRunner;
