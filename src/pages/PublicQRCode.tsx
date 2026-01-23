import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Download, Copy, Check, Loader2 } from "lucide-react";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
}

const PublicQRCode = () => {
  const { slug } = useParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchRestaurant();
    }
  }, [slug]);

  const fetchRestaurant = async () => {
    const { data, error } = await supabase
      .from("restaurants")
      .select("id, name, slug")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) {
      setNotFound(true);
    } else {
      setRestaurant(data);
    }
    setLoading(false);
  };

  const menuUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/menu/${slug}`
      : "";

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById("qr-code-svg");
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = 512;
        canvas.height = 512;
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, 512, 512);

          const link = document.createElement("a");
          link.download = `${restaurant?.name.replace(/\s+/g, "-").toLowerCase()}-qr-code.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
        }
      };

      img.src =
        "data:image/svg+xml;base64," +
        btoa(unescape(encodeURIComponent(svgData)));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-display text-3xl font-semibold mb-2">
            Restaurant Not Found
          </h1>
          <p className="text-muted-foreground">
            This restaurant doesn't exist or the link is incorrect.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <Link
            to={`/menu/${slug}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Menu
          </Link>
        </div>
      </header>

      <main className="flex-1 container max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-2">
            Your Menu QR Code
          </h1>
          <p className="text-muted-foreground">
            Print this QR code and place it on tables for customers to scan
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 max-w-sm mx-auto animate-slide-up">
          <div className="bg-white p-4 rounded-xl shadow-soft mb-6">
            <QRCodeSVG
              id="qr-code-svg"
              value={menuUrl}
              size={256}
              level="H"
              includeMargin={true}
              className="w-full h-auto"
              fgColor="#2d1810"
            />
          </div>

          <div className="text-center mb-6">
            <h2 className="font-display text-xl font-semibold text-foreground">
              {restaurant?.name}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Scan to view menu</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleDownloadQR}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium shadow-soft"
            >
              <Download className="w-5 h-5" />
              Download QR Code
            </button>

            <button
              onClick={handleCopyUrl}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copy Menu Link
                </>
              )}
            </button>
          </div>
        </div>

        <div
          className="mt-8 bg-muted rounded-xl p-6 animate-fade-in"
          style={{ animationDelay: "200ms" }}
        >
          <h3 className="font-display text-lg font-semibold text-foreground mb-3">
            📋 How to use
          </h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="font-semibold text-foreground">1.</span>
              Download the QR code image
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-foreground">2.</span>
              Print and laminate for durability
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-foreground">3.</span>
              Place on tables, at the entrance, or in your window
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-foreground">4.</span>
              Customers scan with their phone camera to view your menu!
            </li>
          </ol>
        </div>
      </main>
    </div>
  );
};

export default PublicQRCode;
