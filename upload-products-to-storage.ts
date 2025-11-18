import { readFileSync } from "fs";
import { ObjectStorageService } from "./server/objectStorage";
import { storage } from "./server/storage";

const productImages = [
  { slug: "suns-out-buns-out", filename: "Suns_Out_Buns_Out_tee_bba2d066.png" },
  { slug: "mermaid-off-duty", filename: "Mermaid_Off_Duty_tee_edef544f.png" },
  { slug: "beach-please", filename: "Beach_Please_tee_fd830d35.png" },
  { slug: "salty-but-sweet", filename: "Salty_But_Sweet_tee_fca3558b.png" },
  { slug: "resting-beach-face", filename: "Resting_Beach_Face_tee_0d4de7ff.png" },
  { slug: "shell-yeah", filename: "Shell_Yeah_tee_d04241da.png" },
];

async function uploadProductImages() {
  console.log("Starting product image upload to object storage...");
  const objectStorageService = new ObjectStorageService();

  for (const { slug, filename } of productImages) {
    try {
      console.log(`\nProcessing ${slug}...`);
      
      // Read the image file
      const imagePath = `attached_assets/generated_images/${filename}`;
      const imageBuffer = readFileSync(imagePath);
      
      // Step 1: Get presigned upload URL
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      console.log(`  Got presigned upload URL`);
      
      // Step 2: Upload the file to the presigned URL
      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: imageBuffer,
        headers: {
          "Content-Type": "image/png",
        },
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }
      
      console.log(`  Image uploaded successfully to storage`);
      
      // Step 3: Set ACL policy to make it public and get the final object path
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        uploadURL,
        {
          owner: "admin",
          visibility: "public",
        }
      );
      
      console.log(`  ACL set, final object path: ${objectPath}`);
      
      // Step 4: Update the product in the database
      const products = await storage.getAllProducts();
      const product = products.find(p => p.imageUrl?.includes(slug));
      
      if (product) {
        await storage.updateProduct(product.id, {
          imageUrl: objectPath,
        });
        console.log(`  ✓ Product "${product.name}" updated with image URL`);
      } else {
        console.warn(`  ⚠ Warning: Could not find product with slug ${slug}`);
      }
      
    } catch (error) {
      console.error(`  ✗ Failed to upload ${slug}:`, error);
    }
  }
  
  console.log("\n✓ Upload process complete!");
}

uploadProductImages().catch(console.error);
