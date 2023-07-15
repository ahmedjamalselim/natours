/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

export const signup = async (name, email, password, passwordConfirm) => {
  try { 
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/signup',
      data: {
        name,
        email,
        password,
        passwordConfirm
      }
    });

    console.log(res);

    if (res.data.status === 'success') {
      location.assign('/login');
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
