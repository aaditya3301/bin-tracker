import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>BinTrack</div>
      <div className={styles.navLinks}>
        <Link href="#features">Features</Link>
        <Link href="#">Download App</Link>
        <Link href="#">About</Link>
        <Link href="#">Contact</Link>
      </div>
    </nav>
  );
}