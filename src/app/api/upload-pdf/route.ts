// app/api/upload-pdf/route.ts
import { NextResponse } from "next/server";
import { uploadPDF } from "../../actions";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const result = await uploadPDF(formData);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error handling file upload:", error);
    return NextResponse.json(
      { error: error.message || "Error uploading file" },
      { status: 500 }
    );
  }
}

// Increase payload size limit for PDF uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};
