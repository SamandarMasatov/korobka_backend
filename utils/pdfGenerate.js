import fs from "fs";
import pdf from 'html-pdf'
import path from "path";
import generateHTML from "../template/checkHtml.js";

const publicDir = path.join(process.cwd(), 'public');
  
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

const pdfDir = path.join(publicDir, 'pdf');

if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir);
}

export default function pdfGenerate(save, orderId) {
    const htmlContent = generateHTML(save);
    return new Promise((resolve, reject) => {
        pdf.create(htmlContent, { format: 'Letter' }).toFile(path.join(pdfDir, `check-${orderId}.pdf`), function(err, response) {
            if (err) {
                reject(err);
            } else {
                const urlRes = `http://localhost:5000/pdf/check-${orderId}.pdf`;
                resolve({ url: urlRes, result: true });
            }
        });
    });
}