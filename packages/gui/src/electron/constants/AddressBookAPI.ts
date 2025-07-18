import API from './API';

enum AddressBookAPI {
  READ = `${API.ADDRESS_BOOK}:read`,
  SAVE = `${API.ADDRESS_BOOK}:save`,
}
export default AddressBookAPI;
