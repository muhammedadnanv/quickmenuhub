import { Heart, QrCode } from "lucide-react";
import { Link } from "react-router-dom";

const SupportFooter = () => {
  return (
    <footer className="mt-12 pb-8">
      <div className="container max-w-2xl mx-auto px-4">
        <div className="bg-card border border-border rounded-2xl p-6 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://razorpay.me/@adnan4402"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium shadow-soft"
            >
              <Heart className="w-5 h-5" />
              Support / Donate
            </a>
            <Link
              to="/qr"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors font-medium"
            >
              <QrCode className="w-5 h-5" />
              Get QR Code
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Powered by Digital Menu • Scan & Browse
          </p>
        </div>
      </div>
    </footer>
  );
};

export default SupportFooter;
