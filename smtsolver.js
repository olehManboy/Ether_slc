var commandExistsSync = require('command-exists').sync;
var execSync = require('child_process').execSync;
var fs = require('fs');
var tmp = require('tmp');

// Timeout in ms.
const timeout = 1000;

var potentialSolvers = [
  {
    name: 'z3',
    params: ' timeout=' + timeout + ' rewriter.pull_cheap_ite=true fp.spacer.q3.use_qgen=true fp.spacer.mbqi=false fp.spacer.ground_pobs=false'
  },
  {
    name: 'cvc4',
    params: '--lang=smt2 --tlimit=' + timeout
  }
];
var solvers = potentialSolvers.filter(solver => commandExistsSync(solver.name));

function solve (query) {
  if (solvers.length === 0) {
    throw new Error('No SMT solver available. Assertion checking will not be performed.');
  }

  var tmpFile = tmp.fileSync({ postfix: '.smt2' });
  fs.writeFileSync(tmpFile.name, query);
  console.log(query);
  // TODO For now only the first SMT solver found is used.
  // At some point a computation similar to the one done in
  // SMTPortfolio::check should be performed, where the results
  // given by different solvers are compared and an error is
  // reported if solvers disagree (i.e. SAT vs UNSAT).
  var solverOutput;
  try {
    solverOutput = execSync(
      solvers[0].name + ' ' + solvers[0].params + ' ' + tmpFile.name, {
        stdio: 'pipe'
      }
    ).toString();
  } catch (e) {
    // execSync throws if the process times out or returns != 0.
    // The latter might happen with z3 if the query asks for a model
    // for an UNSAT formula. We can still use stdout.
    solverOutput = e.stdout.toString();
    if (
      !solverOutput.startsWith('sat') &&
      !solverOutput.startsWith('unsat') &&
      !solverOutput.startsWith('unknown') &&
      !solverOutput.startsWith('(error') &&
      !solverOutput.startsWith('error')
    ) {
      throw new Error('Failed to solve SMT query. ' + e.toString());
    }
  }
  // Trigger early manual cleanup
  tmpFile.removeCallback();
  console.log("OUTPUT IS");
  console.log(solverOutput);
  return solverOutput;
}

module.exports = {
  smtSolver: solve,
  availableSolvers: solvers.length
};
