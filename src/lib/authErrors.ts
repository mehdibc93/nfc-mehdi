// Messages d'erreur de Supabase Auth (en anglais) traduits pour le restaurateur.
type Dt = <T>(fr: T, en: T) => T;

export function authErrorMessage(message: string, dt: Dt): string {
  const text = message.toLowerCase();
  if (text.includes('already registered') || text.includes('already been registered')) {
    return dt(
      'Un compte existe déjà avec cet email. Connectez-vous, ou utilisez « Mot de passe oublié ».',
      'An account already exists with this email. Log in, or use "Forgot password".',
    );
  }
  if (text.includes('rate limit') || text.includes('too many') || text.includes('security purposes')) {
    return dt(
      'Trop de tentatives en peu de temps. Patientez une minute avant de réessayer.',
      'Too many attempts in a short time. Please wait a minute before trying again.',
    );
  }
  if (text.includes('invalid') && text.includes('email')) {
    return dt('Cette adresse email n’est pas valide.', 'This email address is not valid.');
  }
  if (text.includes('password')) {
    return dt('Le mot de passe doit contenir au moins 6 caractères.', 'The password must be at least 6 characters long.');
  }
  if (text.includes('error sending') || text.includes('smtp')) {
    return dt(
      'L’email de confirmation n’a pas pu être envoyé. Réessayez dans quelques minutes ou contactez-nous.',
      'The confirmation email could not be sent. Try again in a few minutes or contact us.',
    );
  }
  return message;
}
