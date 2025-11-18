import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Product, InsertProduct, insertProductSchema } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError, isForbiddenError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

export default function AdminDashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  const { error: adminCheckError } = useQuery({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    if (adminCheckError && isForbiddenError(adminCheckError as Error)) {
      toast({
        title: "Access Denied",
        description: "You do not have admin privileges. Please contact the store owner.",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/");
      }, 2000);
    } else if (adminCheckError && isUnauthorizedError(adminCheckError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [adminCheckError, setLocation, toast]);

  const { data: products, isLoading: productsLoading, error: productsError } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "0.00",
      imageUrl: "",
      availableSizes: ["S", "M", "L", "XL"],
      availableColors: ["White", "Black", "Navy", "Gray"],
      stockQuantity: 0,
      lowStockThreshold: 10,
    },
  });

  useEffect(() => {
    if (editingProduct) {
      form.reset({
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price,
        imageUrl: editingProduct.imageUrl,
        availableSizes: editingProduct.availableSizes,
        availableColors: editingProduct.availableColors,
        stockQuantity: editingProduct.stockQuantity,
        lowStockThreshold: editingProduct.lowStockThreshold,
      });
      setUploadedImageUrl(editingProduct.imageUrl);
    } else {
      form.reset({
        name: "",
        description: "",
        price: "0.00",
        imageUrl: "",
        availableSizes: ["S", "M", "L", "XL"],
        availableColors: ["White", "Black", "Navy", "Gray"],
        stockQuantity: 0,
        lowStockThreshold: 10,
      });
      setUploadedImageUrl("");
    }
  }, [editingProduct, form]);

  const createProductMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      return await apiRequest("POST", "/api/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product created successfully" });
      setIsDialogOpen(false);
      form.reset();
      setUploadedImageUrl("");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      if (isForbiddenError(error)) {
        toast({
          title: "Access Denied",
          description: "You do not have admin privileges.",
          variant: "destructive",
        });
        setTimeout(() => {
          setLocation("/");
        }, 2000);
        return;
      }
      toast({
        title: "Failed to create product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertProduct }) => {
      return await apiRequest("PUT", `/api/products/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product updated successfully" });
      setIsDialogOpen(false);
      setEditingProduct(null);
      form.reset();
      setUploadedImageUrl("");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      if (isForbiddenError(error)) {
        toast({
          title: "Access Denied",
          description: "You do not have admin privileges.",
          variant: "destructive",
        });
        setTimeout(() => {
          setLocation("/");
        }, 2000);
        return;
      }
      toast({
        title: "Failed to update product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/products/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product deleted successfully" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      if (isForbiddenError(error)) {
        toast({
          title: "Access Denied",
          description: "You do not have admin privileges.",
          variant: "destructive",
        });
        setTimeout(() => {
          setLocation("/");
        }, 2000);
        return;
      }
      toast({
        title: "Failed to delete product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertProduct) => {
    const finalData = {
      ...data,
      imageUrl: uploadedImageUrl || data.imageUrl || "",
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: finalData });
    } else {
      createProductMutation.mutate(finalData);
    }
  };

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    return {
      method: "PUT" as const,
      url: response.uploadURL,
    };
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    console.log("=== UPLOAD COMPLETE CALLBACK ===");
    console.log("Full result:", JSON.stringify(result, null, 2));
    
    try {
      if (result.successful && result.successful.length > 0) {
        const file = result.successful[0];
        console.log("File object:", file);
        console.log("File response:", file.response);
        
        const uploadURL = file.response?.uploadURL;
        console.log("Extracted uploadURL:", uploadURL);
        
        if (!uploadURL) {
          console.error("No uploadURL found in result");
          console.error("Full file object:", JSON.stringify(file, null, 2));
          toast({
            title: "Upload error",
            description: "Could not get upload URL from result",
            variant: "destructive",
          });
          return;
        }

        console.log("Calling /api/product-images with URL:", uploadURL);
        const response = await apiRequest("PUT", "/api/product-images", {
          productImageURL: uploadURL,
        });
        
        console.log("Response from /api/product-images:", response);
        setUploadedImageUrl(response.objectPath);
        form.setValue("imageUrl", response.objectPath);
        toast({
          title: "Image uploaded successfully",
        });
      } else {
        console.warn("No successful uploads in result");
      }
    } catch (error: any) {
      console.error("Upload completion error:", error);
      toast({
        title: "Upload error",
        description: error.message || "Failed to complete upload",
        variant: "destructive",
      });
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container px-4 py-12 md:px-6">
        <div className="mb-8 flex items-center justify-between">
          <h1
            className="font-heading text-3xl font-bold tracking-tight sm:text-4xl"
            data-testid="text-page-title"
          >
            Product Management
          </h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingProduct(null);
                  form.reset();
                  setUploadedImageUrl("");
                }}
                data-testid="button-add-product"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Beach Wave T-Shirt" {...field} data-testid="input-product-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your t-shirt design..."
                            {...field}
                            data-testid="textarea-product-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="24.99"
                            {...field}
                            data-testid="input-product-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="stockQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="100"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-stock-quantity"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lowStockThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Low Stock Alert</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="10"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-low-stock-threshold"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormLabel>Product Image</FormLabel>
                    <div className="mt-2 space-y-2">
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={10485760}
                        onGetUploadParameters={handleGetUploadParameters}
                        onComplete={handleUploadComplete}
                        buttonClassName="w-full"
                      >
                        Upload Image
                      </ObjectUploader>
                      {uploadedImageUrl && (
                        <div className="rounded-lg border p-2">
                          <img
                            src={uploadedImageUrl}
                            alt="Preview"
                            className="h-32 w-32 object-cover rounded"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createProductMutation.isPending || updateProductMutation.isPending}
                    data-testid="button-submit-product"
                  >
                    {createProductMutation.isPending || updateProductMutation.isPending
                      ? "Saving..."
                      : editingProduct
                      ? "Update Product"
                      : "Create Product"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {productsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <Card key={product.id} data-testid={`card-product-${product.id}`}>
                <div className="aspect-[4/5] overflow-hidden rounded-t-lg bg-muted">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-heading font-semibold line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-lg font-bold text-primary">
                    ${parseFloat(product.price).toFixed(2)}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className={product.stockQuantity <= product.lowStockThreshold ? "text-destructive font-medium" : "text-muted-foreground"}>
                      Stock: {product.stockQuantity}
                    </span>
                    {product.stockQuantity <= product.lowStockThreshold && (
                      <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">
                        Low
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setEditingProduct(product);
                        setIsDialogOpen(true);
                      }}
                      data-testid={`button-edit-${product.id}`}
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => deleteProductMutation.mutate(product.id)}
                      disabled={deleteProductMutation.isPending}
                      data-testid={`button-delete-${product.id}`}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-lg text-muted-foreground" data-testid="text-no-products">
                No products yet. Add your first t-shirt design!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
