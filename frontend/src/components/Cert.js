import React, { useState } from "react";
import axios from "axios";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import logoait from "../assets/AIT.svg";
import logooss from "../assets/oss_logo.png";
import oss from "../assets/colorful.png";
import certPdfPath from "../assets/certParticipation.pdf";

const API_URL = process.env.REACT_APP_API_URL || "";

const NumberVerificationForm = () => {
  const [number, setNumber] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDownload = async (certificateId, holderName) => {
    try {
      // 1) Fetch the base PDF
      const existingPdfBytes = await fetch(certPdfPath).then((res) =>
        res.arrayBuffer()
      );
  
      // 2) Load the PDF
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
  
      // 3) Get page dimensions to help with positioning
      const [firstPage] = pdfDoc.getPages();
      const { width, height } = firstPage.getSize();
      console.log(`PDF dimensions: ${width}x${height}`);
  
      // 4) Embed font
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
      // 5) Draw text with adjusted coordinates
      // Remember: PDF coordinates start from bottom-left corner
      // So y=height places text at top, y=0 at bottom
      firstPage.drawText(`${holderName}`, {
        x: 114,
        y: height - 127, // Adjust based on your PDF height
        size: 12,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
  
      firstPage.drawText(`Verification ID : ${certificateId}`, {
        x: 105,
        y: height - 200, // Position below the name
        size: 6,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
  
      firstPage.drawText("This is some random test text to check PDF writing.", {
        x: 50,
        y: height - 250, // Position below verification ID
        size: 14,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
  
      // 6) Save and download as before
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);
  
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `Certificate-${holderName}-Innerve-Nine.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Error customizing/downloading certificate:", err);
    }
  };

  /**
   * Handle form submit for verifying the certificate number
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    if (!number.trim()) {
      setError("Please enter a certificate number");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/verify-certificate`, {
        certificateNumber: number,
      });
      setResult(response.data);
    } catch (err) {
      setError("Unique Certificate Number is Invalid.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen h-full w-full flex flex-col items-center justify-center bg-gray-50 p-4 pt-[100px]">
      {/* Header Section */}
      <div className="w-full h-[100px] p-10 flex fixed top-0 justify-between items-center bg-white shadow-md">
        <a href="https://aitoss.club/" target="_blank" rel="noreferrer">
          <img src={logooss} alt="Logo" className="h-12" />
        </a>
        <img src={logoait} alt="Secondary Logo" className="h-20 w-20" />
      </div>

      {/* Main Content Section */}
      <div className="flex flex-col justify-center items-center w-[100%] max-w-lg bg-white rounded-lg shadow-lg p-6 mt-[60px] mb-[30px]">
        <img src={oss} alt="Secondary Logo" className="w-40" />
        <h1 className="text-2xl font-bold text-center mb-6 mt-6">
          Certificate Verification
        </h1>
        <p className="text-gray-600 mb-6 text-center text-sm">
          Enter the unique number printed on your certificate.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input Field */}
          <input
            type="text"
            placeholder="Enter certificate number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 mt-4 focus:border-transparent"
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Verify Certificate"}
          </button>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md">{error}</div>
          )}

          {/* Result Section */}
          {result && (
            <div className="mt-6 border rounded-lg overflow-hidden">
              <div
                className={`p-4 ${
                  result.isValid ? "bg-green-50" : "bg-red-50"
                }`}
              >
                <p className="text-lg font-semibold">
                  Status:{" "}
                  {result.isValid ? (
                    <span className="text-green-600">Valid Certificate</span>
                  ) : (
                    <span className="text-red-600">Invalid Certificate</span>
                  )}
                </p>
              </div>

              {result.isValid && result.certificateDetails && (
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <p className="text-gray-600">Certificate ID:</p>
                    <p className="col-span-2 font-medium">
                      {result.certificateDetails.certificateId}
                    </p>

                    <p className="text-gray-600">Holder Name:</p>
                    <p className="col-span-2 font-medium">
                      {result.certificateDetails.holderName}
                    </p>

                    <p className="text-gray-600">Category:</p>
                    <p className="col-span-2 font-medium">
                      {result.certificateDetails.category}
                    </p>

                    <p className="text-gray-600">Institute Name:</p>
                    <p className="col-span-2 font-medium">
                      {result.certificateDetails.InstituteName}
                    </p>

                    <p className="text-gray-600">Issue Date:</p>
                    <p className="col-span-2 font-medium">
                      {result.certificateDetails.issueDate}
                    </p>
                  </div>

                  {/* Download Button (if the certificate is valid) */}
                  <button
                    type="button"
                    onClick={() =>
                      handleDownload(
                        result.certificateDetails.certificateId,
                        result.certificateDetails.holderName
                      )
                    }
                    className="mt-4 w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    Download Certificate
                  </button>
                </div>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Footer Section */}
      <footer className="w-full mt-auto text-center py-4 text-gray-600 text-sm">
        &copy; {new Date().getFullYear()}{" "}
        <a href="https://aitoss.club/" target="_blank" rel="noreferrer">
          Open Source Software Club, AIT
        </a>{" "}
        All rights reserved.
      </footer>
    </div>
  );
};

export default NumberVerificationForm;
