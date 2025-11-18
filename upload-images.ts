import { Storage } from "@google-cloud/storage";
import { readFileSync } from "fs";
import { join } from "path";

const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;

if (!bucketId) {
  throw new Error("DEFAULT_OBJECT_STORAGE_BUCKET_ID not set");
}

const storage = new Storage();
const bucket = storage.bucket(bucketId);

const images = [
  { local: "attached_assets/generated_images/Suns_Out_Buns_Out_tee_bba2d066.png", remote: "public/products/suns-out-buns-out.png" },
  { local: "attached_assets/generated_images/Mermaid_Off_Duty_tee_edef544f.png", remote: "public/products/mermaid-off-duty.png" },
  { local: "attached_assets/generated_images/Beach_Please_tee_fd830d35.png", remote: "public/products/beach-please.png" },
  { local: "attached_assets/generated_images/Salty_But_Sweet_tee_fca3558b.png", remote: "public/products/salty-but-sweet.png" },
  { local: "attached_assets/generated_images/Resting_Beach_Face_tee_0d4de7ff.png", remote: "public/products/resting-beach-face.png" },
  { local: "attached_assets/generated_images/Shell_Yeah_tee_d04241da.png", remote: "public/products/shell-yeah.png" },
];

async function uploadImages() {
  console.log("Uploading images to object storage...");
  
  for (const image of images) {
    try {
      const fileBuffer = readFileSync(image.local);
      const file = bucket.file(image.remote);
      
      await file.save(fileBuffer, {
        metadata: {
          contentType: "image/png",
          metadata: {
            visibility: "public",
          },
        },
      });
      
      console.log(`✓ Uploaded ${image.remote}`);
    } catch (error) {
      console.error(`✗ Failed to upload ${image.remote}:`, error);
    }
  }
  
  console.log("\nDone! Now updating database...");
}

uploadImages().then(() => {
  console.log("All images uploaded successfully!");
}).catch((error) => {
  console.error("Upload failed:", error);
  process.exit(1);
});
