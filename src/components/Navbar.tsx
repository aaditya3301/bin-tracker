import Link from 'next/link';
import styles from '../styles/Home.module.css';
import { signIn } from 'next-auth/react';

export default function Navbar() {
  const handleGetStarted = () => {
    signIn('google', { callbackUrl: '/home' });
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>BinTrack</div>
      <div className={styles.navLinks}>
         <button onClick={handleGetStarted}>Login</button>
         <button onClick={handleGetStarted}>Sign Up</button>
      </div>
    </nav>
  );
}