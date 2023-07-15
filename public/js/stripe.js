/*eslint-disable*/

import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe(
  'pk_test_51N1v1IDgyOFf4aATRpIhes5ScVwlvTtJJbBWzislKym63WnuRnDSbakqeRyDfyPpXSTBNhvRNokD0xCEuJYQXl7z009lOGGgit'
);

export const bookTour = async tourId => {
  try {
    // getting the checkout session from the backend
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );

    console.log(session);

    // redirecting to the checkout form
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err.message);
  }
};
