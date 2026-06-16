import React, { createContext, useContext, useState, useEffect } from 'react';
import { requestOtp as apiRequestOtp, verifyOtp as apiVerifyOtp } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
 const [user, setUser] = useState(null);
 const [token, setToken] = useState(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const storedToken = localStorage.getItem('token');
 const storedUser = localStorage.getItem('user');

 if (storedToken && storedUser) {
 try {
 setToken(storedToken);
 setUser(JSON.parse(storedUser));
 } catch (err) {
 console.error('Failed to parse stored user data', err);
 logout();
 }
 }
 setLoading(false);
 }, []);

 const requestOtp = async (email) => {
 return await apiRequestOtp(email);
 };

 const verifyOtp = async (email, otp) => {
 const data = await apiVerifyOtp(email, otp);
 setToken(data.token);
 setUser(data.user);
 localStorage.setItem('token', data.token);
 localStorage.setItem('user', JSON.stringify(data.user));
 return data;
 };

 const logout = () => {
 setToken(null);
 setUser(null);
 localStorage.removeItem('token');
 localStorage.removeItem('user');
 localStorage.removeItem('last_analysis');
 };

 const value = {
 user,
 token,
 requestOtp,
 verifyOtp,
 logout,
 isAuthenticated: !!token,
 };

 return (
 <AuthContext.Provider value={value}>
 {!loading && children}
 </AuthContext.Provider>
 );
};
