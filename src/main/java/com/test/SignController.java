package com.test;

import com.google.gson.JsonObject;
import ru.antinform.portal.crypto.exception.VerifyException;
import ru.antinform.portal.crypto.service.SignVerifier;
import ru.antinform.portal.crypto.service.SignVerifierOnline;
import ru.antinform.portal.crypto.util.SignUtils;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;

@WebServlet("/sign")
public class SignController extends HttpServlet {
    private static final String STATUS = "status";

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String signature = req.getParameter("signature");
        String data = req.getParameter("data");
        String checkResult = checkSignature(signature, data);
        sendResponse(resp, checkResult);
    }

    private void sendResponse(HttpServletResponse response, String responseText) throws IOException {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setContentType("application/json");
        PrintWriter writer = response.getWriter();
        writer.write(toJson(responseText));
        writer.flush();
    }

    private String toJson(String status) {
        JsonObject object = new JsonObject();
        object.addProperty(STATUS, status);
        return object.toString();
    }

    private String checkSignature(String signature, String data) {
        SignVerifier verifier = new SignVerifierOnline();
        InputStream dataIS = getStream(data);
        InputStream signIS = getStream(signature);
        try {
            return verifier.verifySign(dataIS, signIS);
        } catch (VerifyException e) {
            e.printStackTrace();
            return e.getError();
        }
    }

    private InputStream getStream(String text) {
        return SignUtils.getInputStream(SignUtils.getStringBytes(text));
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.getRequestDispatcher("/WEB-INF/jsp/index.jsp").forward(req, resp);
    }
}
