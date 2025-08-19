const input = document.querySelector('.login__input');
const button = document.querySelector('.login__button');
const form = document.querySelector('.login-form');

const isValid = value => value.length >= 1;
const buttonState = valid => valid ? { disabled: false } : { disabled: true };

const loginState = value => isValid(value) ? { player: value } : null;

