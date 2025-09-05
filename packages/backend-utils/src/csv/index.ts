import { METACHARACTERS } from "@repo/utils-isomorphic";

interface AnyCsvRow {
  [key: string]: string | boolean | number | Date; // Dynamic keys from CSV headers
}

interface CsvRow {
  Email: string;
  "Display Name": string;
  "First Name"?: string;
  "Last Name"?: string;
}

interface EmailGroup {
  [email: string]: string[];
}

export const parseAndPreventFormulaInjection = async (
  csvData: AnyCsvRow[]
): Promise<AnyCsvRow[]> => {
  return csvData.map((row) => {
    const cleanedRow = { ...row };
    Object.keys(row).forEach((key) => {
      const value = row[key];
      if (!value || typeof value !== "string") return;
      const trimmed = value.trim();
      if (METACHARACTERS.test(trimmed)) {
        cleanedRow[key] = ` ${trimmed}`;
      }
    });
    return cleanedRow;
  });
};
/* 
The purpose of this function is to find duplicate emails in a user upload csv. 
While technically the email does not have to be unique, it causes issues in the user detail assignment, so rather
than allow non-unique emails, we want to throw an error to tell the user uploading the csv (via ui or sftp) 
that there are duplicate emails associated with X users. 
*/
export const getDuplicateEmailsDataFromCsv = (
  syncableCsv: CsvRow[]
): EmailGroup => {
  const emailMap = new Map<string, string[]>();

  for (const row of syncableCsv) {
    const email = row?.Email?.toLowerCase()?.trim();
    let displayName = row?.["Display Name"]?.toLowerCase()?.trim();
    if (!displayName) {
      displayName =
        row?.["First Name"]?.toLowerCase()?.trim() +
          " " +
          row?.["Last Name"]?.toLowerCase()?.trim() || "";
    }
    if (!email) continue;

    if (!emailMap.has(email)) {
      emailMap.set(email, []);
    }
    emailMap.get(email)?.push(displayName);
  }

  // Convert map to object, only including emails with multiple names
  const namesAndEmailsOfDuplicates = Array.from(emailMap.entries())
    .filter(([_, names]) => names.length > 1)
    .reduce((acc, [email, names]) => {
      acc[email] = names;
      return acc;
    }, {} as EmailGroup);

  return namesAndEmailsOfDuplicates;
};
