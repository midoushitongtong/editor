import axios from 'axios';

const instance = axios.create();

instance.defaults.adapter = window.require('axios/lib/adapters/http');

export default instance;
