import Image from 'next/image';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <Link href="/">
          <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
        </Link>
        <p>
          Powered by{' '}
          <a
            href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vercel
          </a>
        </p>
      </div>
      <style jsx>{`
        .footer {
          width: 100%;
          height: 100px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .container {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          gap: 1rem;
        }
        .footer a {
          display: flex;
          justify-content: center;
          align-items: center;
        }
      `}</style>
    </footer>
  );
};

export default Footer;