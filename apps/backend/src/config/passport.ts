import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as MicrosoftStrategy } from "passport-microsoft";
import User from "../models/user.model";

// --- GOOGLE OAUTH STRATEGY ---
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "placeholder",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder",
      callbackURL: "/api/auth/google/callback",
      passReqToCallback: true, // Optional, allows access to req
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        const googleId = profile.id;
        const name = profile.displayName;

        if (!email) {
          return done(
            new Error("Email no encontrado en el perfil de Google"),
            false,
          );
        }

        // Check if user already exists
        let user = await User.findOne({ email });

        if (user) {
          // Si el usuario existe, asegurarnos de que el googleId se vincule
          if (!user.googleId) {
            user.googleId = googleId;
            await user.save();
          }
          return done(null, user);
        }

        // Si el usuario no existe, crearlo
        // Nota: Le asignamos una contraseña súper compleja random
        // porque un usuario OAuth no hace log-in con contraseña local
        user = await User.create({
          name,
          email,
          googleId,
          password:
            Math.random().toString(36).slice(-10) +
            Math.random().toString(36).slice(-10),
          role: "user",
        });

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    },
  ),
);

// --- MICROSOFT OAUTH STRATEGY ---
passport.use(
  new MicrosoftStrategy(
    {
      clientID: process.env.MICROSOFT_CLIENT_ID || "placeholder",
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "placeholder",
      callbackURL: "/api/auth/microsoft/callback",
      scope: ["user.read"],
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: any,
    ) => {
      try {
        const email = profile.emails?.[0].value;
        const microsoftId = profile.id;
        const name = profile.displayName;

        if (!email) {
          return done(
            new Error("Email no encontrado en el perfil de Microsoft"),
            false,
          );
        }

        let user = await User.findOne({ email });

        if (user) {
          if (!user.microsoftId) {
            user.microsoftId = microsoftId;
            await user.save();
          }
          return done(null, user);
        }

        user = await User.create({
          name,
          email,
          microsoftId,
          password:
            Math.random().toString(36).slice(-10) +
            Math.random().toString(36).slice(-10),
          role: "user",
        });

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    },
  ),
);

export default passport;
