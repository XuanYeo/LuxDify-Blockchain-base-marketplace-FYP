"use client";
import React, { useState } from "react";
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import './loginregister.css';
import axios from "axios";
import { ethers } from 'ethers';
import LoginHeader from '../component/LoginHeader/loginheader';
import Footer from '../component/Footer/Footer';
import Background from '../component/Background/background';

interface RegistrationResponse {
    success: boolean;
    wallet?: {
        address: string;
        privateKey: string;
    };
    error?: string;
}

function LoginRegister() {
    
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    React.useEffect(() => {
        if (typeof window !== "undefined") {   // <- ensure client only
            const page = document.getElementById("page");
            const tab = searchParams.get('tab');
            if (tab === 'register') {
              page?.classList.add("active");
            } else {
              page?.classList.remove("active");
            }
        }
    }, [searchParams]);

    function switchPage(type: "login" | "register") {
        const page = document.getElementById("page");
        if (type === "login") {
            page?.classList.remove("active");
            router.push(`${pathname}?tab=login`);
        } else {
            page?.classList.add("active");
            router.push(`${pathname}?tab=register`);
        }
    }

    /*Register*/
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [address, setAddress] = useState("");
    const [gender, setGender] = useState("");
    const [DOB, setDob] = useState("");
    const [phone, setPhone] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [walletInfo, setWalletInfo] = useState(null);
    const [isRegisterSuccess, setIsRegisterSuccess] = useState(false);


    async function register(event: React.FormEvent) {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
        if (!passwordRegex.test(password)) {
            return alert("❌ Password must contain uppercase, lowercase, and a number.");
        }
        event.preventDefault();
        try {
            // Store the response from axios
            const response = await axios.post<RegistrationResponse>("http://localhost:3000/register", { name, email, password, address, gender, DOB, phone_number: phone });
            console.log("Registration response:", response.data);

            if (response.data.success && response.data.wallet) {
                // Store wallet info in localStorage
                localStorage.setItem('userWallet', JSON.stringify(response.data.wallet));
                
                // Show success message with wallet info
                alert(`Account created successfully! You've been assigned a wallet:\nAddress: ${response.data.wallet.address}\n\nYour wallet has been connected automatically.`);
                
                // Navigate to home page
                //window.location.reload();
            } else {
                alert("Registration failed. Please try again.");
            }
        } catch (err) {
            console.error("Registration error:", err);
        
            if (axios.isAxiosError(err) && err.response) {
                const backendError = err.response.data?.error;
                if (backendError === "Username or Email already exists") {
                    alert("❌ Username or Email already exists. Please use a different one.");
                } else {
                    alert(`❌ Registration failed: ${backendError || "Unknown error"}`);
                }
            } else {
                alert("❌ Registration failed. Please try again later.");
            }
        }
    }

    /*Login*/
    function login(event: React.FormEvent) {
        event.preventDefault();
        axios.post("http://localhost:3000/login", values)
        .then(res => {
            if(res.data.Status === "Success") {
                // Save user data including wallet info
                localStorage.setItem('userData', JSON.stringify(res.data.userData));
                localStorage.setItem('userWallet', JSON.stringify(res.data.userData.wallet));
                localStorage.setItem("userId", res.data.userData.user_id.toString());
                localStorage.setItem('userRole', res.data.userData.role);

                const role = localStorage.getItem('userRole');
                if (role === "admin") {
                router.push("/admin");
                } else {
                router.push("/user");
                }
            } else {
                alert(res.data.Error);
            }
        }).catch(err => console.log(err));
    }
    const [values, setValues] = useState({
        name: "",
        password: "",
    });

    return (
        <div className="login-main">
            <Background />
            <LoginHeader />
            <div className="loginregister-content">
                <div className="loginregister-container" id="page">

                    <div className="form-box login">
                        <form onSubmit={login}>
                            <h1>Login</h1>
                            <div className="input-box">
                                <input type="text" placeholder="Name" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValues({...values, name: e.target.value})} required />
                                <i className="fa-solid fa-user"></i>
                            </div>
                            <div className="input-box">
                                <input type="password" placeholder="Password" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValues({...values, password: e.target.value})} required />
                                <i className="fa-solid fa-lock"></i>
                            </div>
                            <div className="forgot-password">
                                <a href="/login/forget_password">Forgot Password?</a>
                            </div>
                            <div>
                                <button className="btn login-btn" type="submit">LOGIN</button>
                            </div>
                        </form>
                    </div>

                    <div className="form-box register">
                        <form onSubmit={register}>
                            <h1>Create Account</h1>
                            <div className="input-box">
                                <input type="text" placeholder="Name" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} required />
                                <i className="fa-solid fa-user"></i>
                            </div>
                            <div className="input-box">
                                <input type="text" placeholder="Email" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} required />
                                <i className="fa-solid fa-envelope"></i>
                            </div>
                            <div className="input-box">
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const value = e.target.value;
                                    setPassword(value);

                                    // Check password validity
                                    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
                                    setPasswordError(passwordRegex.test(value) ? "" : "Password must contain uppercase, lowercase, and a number.");
                                    }}
                                    required
                                />
                                <i className="fa-solid fa-lock"></i>
                                {passwordError && (
                                    <p className="error-message">{passwordError}</p>
                                )}
                            </div>
                            <div className="input-box">
                                <select onChange={(e) => setGender(e.target.value)} required>
                                    <option value="">Select Gender</option>
                                    <option value="pns">Prefer not to say</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                                <i className="fa-solid fa-venus-mars"></i>
                            </div>
                            <div className="input-box">
                                <input
                                    type="date"
                                    onChange={(e) => setDob(e.target.value)}
                                    required
                                    max={new Date().toISOString().split("T")[0]}
                                />
                            </div>
                            <div className="input-box">
                                <input type="tel" placeholder="Phone Number" onChange={(e) => setPhone(e.target.value)} required />
                                <i className="fa-solid fa-phone"></i>
                            </div>
                            <div className="input-box">
                                <textarea rows={3} placeholder="Address" onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAddress(e.target.value)} />
                                <i className="fa-solid fa-location-dot"></i>
                            </div>
                            <div>
                                <button className="btn login-btn" type="submit">REGISTER</button>
                            </div>
                        </form>
                    </div>

                    {/* Switch Page */}
                    <div className="toggle-box">
                        <div className="toggle-panel toggle-left">
                            <h1>Hello, Welcome!</h1>
                            <p>Don't have an account?</p>
                            <button className="btn toggle-btn" id="register" onClick={() => switchPage("register")}>Register</button>
                        </div>
                        <div className="toggle-panel toggle-right">
                            <h1>Welcome Back!</h1>
                            <p>Already have an account?</p>
                            <button className="btn toggle-btn" id="login" onClick={() => switchPage("login")}>Login</button>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    )
}

export default LoginRegister;