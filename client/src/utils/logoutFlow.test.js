import {LOGOUT_CONFIRMATION, shouldLogoutImmediately} from './logoutFlow';

describe('logout flow', () => {
  test('logs out immediately on web where native Alert confirmation is unreliable', () => {
    expect(shouldLogoutImmediately('web')).toBe(true);
  });

  test('keeps confirmation on native platforms', () => {
    expect(shouldLogoutImmediately('ios')).toBe(false);
    expect(shouldLogoutImmediately('android')).toBe(false);
  });

  test('keeps stable confirmation copy', () => {
    expect(LOGOUT_CONFIRMATION.title).toBe('Logout');
    expect(LOGOUT_CONFIRMATION.message).toContain('logout');
  });
});
