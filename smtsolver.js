var commandExistsSync = require('command-exists').sync;
var execSync = require('child_process').execSync;
var fs = require('fs');
var tmp = require('tmp');

// Timeout per query in seconds.
const timeout = 10;

var potentialSolvers = [
  {
    name: 'Eldarica Vanilla',
    command: 'eld',
    params: '-horn -t:' + timeout
  },
  /*
  {
    name: 'Eldarica No Abstraction',
    command: 'eld',
    params: '-horn -t:' + timeout + ' -abstract:off'
  },
  {
    name: 'Spacer Vanilla',
    command: 'z3',
    params: '-smt2 timeout=' + (timeout * 1000) + ' rewriter.pull_cheap_ite=true fp.spacer.q3.use_qgen=true fp.spacer.mbqi=false fp.spacer.ground_pobs=false'
  },
  {
    name: 'Spacer Quant',
    command: 'z3',
    params: '-smt2 timeout=' + (timeout * 1000) + ' rewriter.pull_cheap_ite=true fp.spacer.q3.use_qgen=true fp.spacer.mbqi=false fp.spacer.ground_pobs=false'
  }
  */
];
var solvers = potentialSolvers.filter(solver => commandExistsSync(solver.command));

function solve (query, solver) {
  if (solver === undefined) {
    throw new Error('No SMT solver available. Assertion checking will not be performed.');
  }

	console.log(query)
  var tmpFile = tmp.fileSync({ postfix: '.smt2' });
  fs.writeFileSync(tmpFile.name, query);
  var solverOutput;
  try {
    solverOutput = execSync(
      solver.command + ' ' + solver.params + ' ' + tmpFile.name, {
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
      !solverOutput.startsWith('unknown')
    ) {
      console.log(solverOutput);
      console.log(e.stderr.toString());
      throw new Error('Failed to solve SMT query. ' + e.toString());
    }
  }
  // Trigger early manual cleanup
  tmpFile.removeCallback();
  console.log(solverOutput);
  return solverOutput;
}

module.exports = {
  smtSolver: solve,
  availableSolvers: solvers
};
