let MAIN_URL_QA_UAT = 'https://uatcom.edureka.in/';
let MAIN_URL_QA_A2 = 'https://a2com.edureka.in/';

let MAIN_URL_PRODUCTION = 'https://www.edureka.co/';
let API_VERSION = 'api/1.0';
let API_VERSION_2 = 'api/2.0';

let MAIN_URL = MAIN_URL_QA_A2;

let BASE_URL = 'https://cuore-backend-1.onrender.com';
let BASE_URL_V2 = MAIN_URL + API_VERSION_2;

let IS_PRODUCTION = MAIN_URL === MAIN_URL_PRODUCTION ? true : false;

const REGEX = {
  // eslint-disable-next-line no-useless-escape
  EMAIL:
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  TEXT: /^[a-zA-Z]+$/,
  NUMBERS: /^\d{10,12}$/,
  ALPHA_NUMERIC: /^[a-z0-9]+$/i,
  PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{4,}$/,
  // NAME: /^([a-zA-Z]+\s)*[a-zA-Z]+$/
  // NAME: /[^0-9a-zA-Z]/g
  NAME: /^([a-zA-Z]+\s)*[a-zA-Z]+$/,
  FULLNAME: /^[a-zA-Z]{2,40}( [a-zA-Z]{2,40})+$/,
};

const Constants = {
  BASEURL: BASE_URL,
};
export default Constants;
