import { getSubdomainSlug, getPathSlug } from './tenant';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

// Test getSubdomainSlug
assert(getSubdomainSlug('localhost') === null, 'localhost should have null slug');
assert(getSubdomainSlug('ahmed.localhost') === 'ahmed', 'ahmed.localhost should be ahmed');
assert(getSubdomainSlug('www.localhost') === null, 'www.localhost should be null');
assert(getSubdomainSlug('127.0.0.1') === null, 'IP should be null');
assert(getSubdomainSlug('demo.mysaas.com') === 'demo', 'demo.mysaas.com should be demo');
assert(getSubdomainSlug('www.mysaas.com') === null, 'www.mysaas.com should be null');

// Test getPathSlug
assert(getPathSlug('/') === null, '/ should be null');
assert(getPathSlug('/t/ahmed') === 'ahmed', '/t/ahmed should be ahmed');
assert(getPathSlug('/t/ahmed/login') === 'ahmed', '/t/ahmed/login should be ahmed');
assert(getPathSlug('/subjects/123') === null, '/subjects/123 should be null');

