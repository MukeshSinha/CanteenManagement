import axios from 'axios'; 
const axiosInstance = axios.create({
    baseUrl: 'http://localhost:8080/api', // Replace with your backend API URL
    headers: {
        'Content-Type': 'application/json',
    },
});
export default axiosInstance;