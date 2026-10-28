'use strict';
let operations = [];
const element = id => document.getElementById(id);
async function load() {
  const response = await fetch('/api/operations', {cache:'no-store'});
  if (response.status === 401) { location.reload(); return; }
  if (!response.ok) throw new Error('Нет доступа к операциям приложения');
  operations = await response.json();
  operations.forEach((op, i) => element('operation').add(new Option(op.title, String(i))));
  select();
}
function select() {
  const op = operations[Number(element('operation').value)];
  element('arguments').value = JSON.stringify(op.args || {}, null, 2);
  element('confirm').checked = false;
  element('effect').textContent = op.mutation ? 'Эта операция изменяет состояние сервиса. Проверьте параметры и подтвердите действие.' : 'Эта операция читает данные сервиса.';
  element('confirm').closest('p').hidden = !op.mutation;
}
element('operation').addEventListener('change', select);
element('operation-form').addEventListener('submit', async event => {
  event.preventDefault();
  const op = operations[Number(element('operation').value)];
  if (op.mutation && !element('confirm').checked) { element('status').textContent = 'Сначала подтвердите точную операцию'; return; }
  element('execute').disabled = true;
  element('result').textContent = '';
  element('status').textContent = 'Выполняется запрос к сервису…';
  try {
    const response = await fetch('/api/call', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({tool:op.tool, args:JSON.parse(element('arguments').value), confirm:element('confirm').checked})});
    if (response.status === 401) { location.reload(); return; }
    const text = await response.text();
    if (!response.ok) throw new Error(text);
    element('result').textContent = JSON.stringify(JSON.parse(text), null, 2);
    element('status').textContent = 'Получен ответ действующего сервиса';
  } catch (error) { element('status').textContent = error.message; }
  finally { element('execute').disabled = false; element('confirm').checked = false; }
});
load().catch(error => { element('status').textContent = error.message; });
