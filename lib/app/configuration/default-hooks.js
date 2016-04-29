/**
 * Default hooks
 *
 * (order still matters for now for some of these)
 *
 * TODO:
 * make order _not_ matter
 * (it pretty much doesn't already b/c of our use of events...
 *  ...but for a few core hooks, e.g. `moduleloader`, it still does)
 */

module.exports = {
  'moduleloader': true,
  'userconfig': true,
  'userhooks': true
};