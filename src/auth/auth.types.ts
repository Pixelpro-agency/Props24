export interface LocalAccount {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    fiscalCode: string;
    password: string;
    createdAt: string;
}

/**
 * TODO: verificare sul sito originale il flusso degli inquilini invitati e
 * testarne il comportamento prima di implementare permessi e visibilità.
 * Un inquilino invitato dovrà poter utilizzare i CRUD del gestionale e vedere
 * la locazione intestata a lui, ma non dovrà vedere i dati della proprietà o
 * la scheda inquilino appartenenti all'account del proprietario che lo ha invitato.
 */

export interface LocalSession {
    accountId: string;
}

export interface LoginCredentials {
    identifier: string;
    password: string;
}

export interface RegistrationData {
    firstName: string;
    lastName: string;
    fiscalCode: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export type AuthResult =
    | {
          success: true;
          account: LocalAccount;
      }
    | {
          success: false;
          error: string;
      };
