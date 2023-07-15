/* eslint-disable*/
import axios from 'axios';
import { showAlert } from './alerts';

export const forgotPassword = async email => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/forgetpassword',
      data: {
        email
      }
    });

    if (res.data.status === 'success') {
      showAlert('success', res.data.message);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
