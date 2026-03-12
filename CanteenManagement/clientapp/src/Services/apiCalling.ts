import { API_BASE_URL } from './config';
import axios from 'axios';

export const apiCallingData = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});