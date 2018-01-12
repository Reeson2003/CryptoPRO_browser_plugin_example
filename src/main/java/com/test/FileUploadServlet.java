package com.test;

import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.Part;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Paths;

@WebServlet("/upload")
@MultipartConfig
public class FileUploadServlet extends HttpServlet {
    private enum Result {
        SUCCESS, ERROR
    }

    private static final int FILE_MAX_SIZE = 1000 * 1024;

    private String folderPath = "C:/my_workspace/workspace/testWebapp/upload/";

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        Part part = req.getPart("file");
        if (checkFileSize(part)) {
            String fileName = getFileName(part);
            InputStream fileInputStream = getInputStream(part);
            File file = getFile(fileName);
            writeFile(fileInputStream, file);
            writeResponse(resp, Result.SUCCESS);
        } else {
            writeResponse(resp, Result.ERROR);
        }
    }

    private String composeSuccessResponse() {
        String text = new StringBuilder()
                .append("<h1>")
                .append("Upload success")
                .append("</h1>")
                .toString();
        return composeResponse(text);
    }

    private String composeErrorResponse() {
        String text = new StringBuilder()
                .append("<h1>")
                .append("Max file size is ")
                .append("<it>")
                .append(FILE_MAX_SIZE)
                .append("</it>")
                .append(" bytes")
                .append("</h1>")
                .toString();
        return composeResponse(text);

    }

    private String composeResponse(String text) {
        return new StringBuilder()
                .append("<!DOCTYPE html>")
                .append("<html>")
                .append("<head>")
                .append("<title>")
                .append("</title>")
                .append("</head>")
                .append("<body>")
                .append(text)
                .append("</body>")
                .append("</html>")
                .toString();
    }

    private void writeResponse(HttpServletResponse response, Result result) throws IOException {
        response.setContentType("text/html");
        PrintWriter writer = response.getWriter();
        switch (result) {
            case SUCCESS:
                writer.write(composeSuccessResponse());
                break;
            case ERROR:
                writer.write(composeErrorResponse());
                break;
        }
    }

    private void writeFile(InputStream inputStream, File file) throws IOException {
        Files.copy(inputStream, file.toPath());
    }

    private File getFile(String fileName) {
        File file = new File(folderPath + fileName);
        return file;
    }

    private InputStream getInputStream(Part part) throws IOException {
        return part.getInputStream();
    }

    private String getFileName(Part part) {
        return Paths.get(part.getSubmittedFileName()).getFileName().toString(); // MSIE fix.
    }

    private boolean checkFileSize(Part part) {
        return FILE_MAX_SIZE > part.getSize();
    }
}
