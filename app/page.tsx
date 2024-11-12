"use client";

import { useState } from "react";
import Papa from "papaparse";

type Product = {
  name: string;
  price: number;
  barcode: string;
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "ISO-8859-1",  // Utilisation de l'encodage ISO-8859-1 pour éviter les caractères spéciaux
      complete: (result) => {
        const parsedProducts: Product[] = result.data.map((row: any) => ({
          name: row["Nom"],
          price: parseFloat(row["Prix Vente TTC"]),
          barcode: row["Code barre"],
        }));
  
        const validProducts = parsedProducts.filter(
          (product) => product.barcode && !isNaN(product.price)
        );
  
        setProducts(validProducts);
        setFileError(null);
      },
      error: (error) => {
        setFileError("Erreur lors du traitement du fichier CSV.");
        console.error(error);
      },
    });
  };
  

  const formatProductName = (name: string): string[] => {
    if (name.length <= 20) return [name];
    const words = name.split(" ");
    let line1 = "";
    let line2 = "";

    for (const word of words) {
      if (line1.length + word.length + 1 <= 20) {
        line1 += (line1 ? " " : "") + word;
      } else if (line2.length + word.length + 1 <= 20) {
        line2 += (line2 ? " " : "") + word;
      } else {
        break;  // Ignore any excess characters beyond 40
      }
    }

    return [line1.trim(), line2.trim()];
  };

  const generateZPL = (product: Product): string => {
    const [line1, line2] = formatProductName(product.name);
    const price = product.price.toFixed(2);
    const barcode = product.barcode;
  
    if (line2) {
      return `
  ^XA
  ^CI27  ; Définit l'encodage en UTF-8 pour les caractères spéciaux
  ^CF0,35
  ^FO20,20^FD${line1}^FS
  ^FO20,60^FD${line2}^FS
  ^CF0,30
  ^FO20,120^GB200,2,2^FS
  ^FO230,150^FDPrix : ${price}^FS
  ^BY2,0,80
  ^FO35,200^BC^FD${barcode}^FS
  ^XZ
  `;
    } else {
      return `
  ^XA
  ^CI27  ; Définit l'encodage en UTF-8 pour les caractères spéciaux
  ^CF0,35
  ^FO20,20^FD${line1}^FS
  ^FO20,80^GB200,2,2^FS
  ^FO230,150^FDPrix : ${price}^FS
  ^BY2,0,80
  ^FO35,200^BC^FD${barcode}^FS
  ^XZ
  `;
    }
  };
  

  const downloadZPL = () => {
    const zplContent = products.map(generateZPL).join("\n");
    const blob = new Blob([zplContent], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "etiquettes.zpl";
    link.click();
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-sans">
      <h1 className="text-2xl font-bold">Générateur d'étiquettes ZPL</h1>

      <div className="flex flex-col items-center">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="mb-4"
        />
        {fileError && <p className="text-red-500">{fileError}</p>}

        {products.length > 0 && (
          <div className="w-full max-w-md mt-8">
            <h2 className="text-lg font-bold mb-4">Prévisualisation des produits :</h2>
            <ul className="space-y-4">
              {products.map((product, index) => (
                <li key={index} className="border p-4 rounded-md shadow-md">
                  <p><strong>Nom :</strong> {product.name}</p>
                  <p><strong>Prix :</strong> {product.price.toFixed(2)}</p>
                  <p><strong>Code-barres :</strong> {product.barcode}</p>
                </li>
              ))}
            </ul>
            <button
              onClick={downloadZPL}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              Télécharger les étiquettes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
