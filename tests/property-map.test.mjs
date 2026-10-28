import { test } from 'node:test';
import assert from 'node:assert/strict';
import { propertyMap } from '../src/lib/property-map.ts';

const noNetwork = async () => { throw new Error('Unexpected network request'); };
const link = 'https://www.google.com/maps?q=7.91,-72.50';
const query = (result) => new URL(result.embed).searchParams.get('q');

test('solo dirección: incluye ciudad y país', async () => {
  assert.equal(query(await propertyMap({ address: 'calle 19a #1-48', city: 'Cúcuta' }, noNetwork)), 'calle 19a #1-48, Cúcuta, Colombia');
});
test('solo enlace: no requiere dirección', async () => {
  const result = await propertyMap({ google_maps_link: link }, noNetwork);
  assert.equal(query(result), '7.91,-72.50');
  assert.equal(result.link, link);
});
test('ambos: Maps prevalece sobre una dirección distinta', async () => {
  assert.equal(query(await propertyMap({ address: 'Bogotá', google_maps_link: link }, noNetwork)), '7.91,-72.50');
});
test('enlace compartido corto: resuelve redirección y prioriza el pin sobre el nombre', async () => {
  const requests = [];
  const result = await propertyMap({ address: 'Otra dirección', google_maps_link: 'https://maps.app.goo.gl/example' }, async (url, options) => {
    requests.push(url);
    assert.equal(options.redirect, 'manual');
    return new Response(null, { status: 302, headers: { location: 'https://www.google.com/maps/place/Casa/@7.8,-72.4,15z/data=!3d7.91!4d-72.50' } });
  });
  assert.equal(query(result), '7.91,-72.50');
  assert.equal(requests.length, 1);
  assert.equal(result.link, 'https://maps.app.goo.gl/example');
});
test('enlace de búsqueda con query', async () => {
  assert.equal(query(await propertyMap({ google_maps_link: 'https://www.google.com/maps/search/?api=1&query=San+Luis+Cucuta' }, noNetwork)), 'San Luis Cucuta');
});
test('enlace embed se conserva', async () => {
  const embed = 'https://www.google.com/maps/embed?pb=example';
  assert.equal((await propertyMap({ google_maps_link: embed }, noNetwork)).embed, embed);
});
test('fallo de Google: conserva enlace y no muestra la dirección alternativa', async () => {
  const result = await propertyMap({ address: 'Dirección distinta', google_maps_link: 'https://maps.app.goo.gl/example' }, noNetwork);
  assert.equal(result.embed, null);
  assert.ok(result.link);
});
test('redirecciones externas no se consultan', async () => {
  let calls = 0;
  const result = await propertyMap({ google_maps_link: 'https://maps.app.goo.gl/example' }, async () => {
    calls++;
    return new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/private' } });
  });
  assert.equal(calls, 1);
  assert.equal(result.embed, null);
});
test('enlaces inválidos no se usan', async () => {
  for (const google_maps_link of ['javascript:alert(1)', 'https://google.com.evil.test/maps?q=x', 'texto', 'https://user:pass@google.com/maps?q=x']) {
    const result = await propertyMap({ address: 'San Luis', google_maps_link }, noNetwork);
    assert.equal(result.link, null);
    assert.ok(query(result).startsWith('San Luis,'));
  }
});
test('sin dirección ni enlace, o dirección provisional: no inventa un mapa', async () => {
  for (const address of [undefined, '', 'Google Maps', 'Ubicación por confirmar (PRO-00001)', 'Ver enlace de Google Maps adjunto']) {
    assert.deepEqual(await propertyMap({ address }, noNetwork), { embed: null, link: null });
  }
});
test('redirecciones circulares tienen límite', async () => {
  let calls = 0;
  const result = await propertyMap({ google_maps_link: 'https://maps.app.goo.gl/example' }, async () => {
    calls++;
    return new Response(null, { status: 302, headers: { location: '/example' } });
  });
  assert.equal(calls, 5);
  assert.equal(result.embed, null);
});
