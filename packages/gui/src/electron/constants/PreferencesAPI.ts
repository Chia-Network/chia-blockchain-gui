import API from './API';

enum PreferencesAPI {
  READ = `${API.PREFERENCES}:read`,
  SAVE = `${API.PREFERENCES}:save`,
  MIGRATE = `${API.PREFERENCES}:migrate`,
}
export default PreferencesAPI;
