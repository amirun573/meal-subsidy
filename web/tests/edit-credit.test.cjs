const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = ts.transpileModule(fs.readFileSync(
  require.resolve('../src/app/api/subsidy/service/subsidy.service.ts'), 'utf8'
), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;

function setup(credit, subsidy, saveResult = []) {
  const writes = [];
  const lookups = [];
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    console: { log() {}, error() {} },
    require(name) {
      if (name === 'next/server') return { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } };
      if (name.endsWith('/libs/prisma')) return { prisma: { subsidy: { findFirst: async (query) => { lookups.push(query); return subsidy; } } } };
      if (name.endsWith('/subsidy.model')) return {
        GetSubsidyCreditSingle: async () => credit,
        SubsidyCreditCascade: async (data) => { writes.push(data); return saveResult; },
      };
      if (name.endsWith('/subsidy.validation')) return { UpdateSubsidyCreditRealTimeValidation: async () => {} };
      if (name.endsWith('/application-log')) return { LogApplicationError: async () => {} };
      return {};
    },
  });
  return { update: exports.UpdateSubsidyCreditRealTimeService, writes, lookups };
}
const request = { user_uuid: 'employee', subsidy_uuid: 'subsidy', amount: 12.5 };

test('creates missing active credit and sets current balance to the entered amount', async () => {
  const { update, writes, lookups } = setup(null, { subsidy_id: 7, user_id: 3 });
  assert.equal((await update(request)).status, 200);
  assert.equal(lookups[0].where.uuid, request.subsidy_uuid);
  assert.equal(lookups[0].where.user.uuid, request.user_uuid);
  assert.equal(writes[0].subsidy.amount, 12.5);
  assert.equal(writes[0].subsidy.subsidy_id, 7);
  assert.equal(writes[0].subsidyCredit.subsidy_id, 7);
  assert.equal(writes[0].subsidyCredit.user_id, 3);
  assert.equal(writes[0].subsidyCredit.credit_amount, 12.5);
  assert.equal(writes[0].subsidyCredit.active, true);
  assert.equal(writes[0].subsidyCredit.subsidy_credit_id, undefined);
});

test('updates existing credit without creating a replacement, including zero balance', async () => {
  const { update, writes, lookups } = setup({ subsidy_credit_id: 9, subsidy_id: 7, credit_amount: 5 }, null);
  assert.equal((await update({ ...request, amount: 0 })).status, 200);
  assert.equal(lookups.length, 0);
  assert.equal(writes[0].subsidyCredit.subsidy_credit_id, 9);
  assert.equal(writes[0].subsidyCredit.credit_amount, 0);
  assert.equal(writes[0].subsidy.amount, 0);
});

test('rejects a missing subsidy or one belonging to another employee', async () => {
  const { update, writes } = setup(null, null);
  assert.equal((await update(request)).status, 400);
  assert.equal(writes.length, 0);
});

test('does not report success when the atomic save fails', async () => {
  const { update } = setup(null, { subsidy_id: 7, user_id: 3 }, null);
  assert.equal((await update(request)).status, 400);
});
