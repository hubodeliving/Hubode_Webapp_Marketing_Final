// send-rent-reminders/src/main.js
const { Client, Databases, Messaging, ID, Query } = require('node-appwrite'); // Ensure Query is destructured

// Helper to format date for email display
const formatDateForEmailDisplay = (dateObj) => {
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
        return 'N/A';
    }
    return dateObj.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
};

// Helper to get the last day of a given month and year
const getLastDayOfMonth = (year, monthIndex) => {
    return new Date(year, monthIndex + 1, 0).getDate();
};

module.exports = async(context) => {
    const { req, res, log, error: logError } = context;

    // 1) Access environment variables from process.env
    const endpointToUse = process.env.APPWRITE_FUNCTION_ENDPOINT || process.env.APPWRITE_ENDPOINT;
    const projectIdToUse = process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
    const apiKeyToUse = process.env.APPWRITE_FUNCTION_API_KEY || process.env.APPWRITE_API_KEY;

    const {
        APPWRITE_DATABASE_ID,
        APPWRITE_TENANCIES_COLLECTION_ID,
        APPWRITE_PROFILES_COLLECTION_ID,
        APPWRITE_ADMIN_SETTINGS_COLLECTION_ID,
        ADMIN_SETTINGS_DOCUMENT_ID
    } = process.env;

    log("Function triggered. Effective Connection & Custom Variables:");
    log(`Using APPWRITE_FUNCTION_ENDPOINT (or fallback): ${endpointToUse || 'MISSING!'}`);
    log(`Using APPWRITE_FUNCTION_PROJECT_ID (or fallback): ${projectIdToUse || 'MISSING!'}`);
    log(`Using APPWRITE_FUNCTION_API_KEY (or fallback): ${apiKeyToUse ? 'Present' : 'MISSING!'}`);

    const customRequiredVarKeys = {
        'APPWRITE_DATABASE_ID': APPWRITE_DATABASE_ID,
        'APPWRITE_TENANCIES_COLLECTION_ID': APPWRITE_TENANCIES_COLLECTION_ID,
        'APPWRITE_PROFILES_COLLECTION_ID': APPWRITE_PROFILES_COLLECTION_ID,
        'APPWRITE_ADMIN_SETTINGS_COLLECTION_ID': APPWRITE_ADMIN_SETTINGS_COLLECTION_ID,
        'ADMIN_SETTINGS_DOCUMENT_ID': ADMIN_SETTINGS_DOCUMENT_ID
    };

    const coreConnectionVars = {
        'EFFECTIVE_APPWRITE_ENDPOINT': endpointToUse,
        'EFFECTIVE_APPWRITE_PROJECT_ID': projectIdToUse,
        'EFFECTIVE_APPWRITE_API_KEY': apiKeyToUse
    };

    let allRequiredVarsPresent = true;
    const missingVarMessages = [];

    for (const [key, value] of Object.entries(coreConnectionVars)) {
        log(`${key}: ${value ? (key === 'EFFECTIVE_APPWRITE_API_KEY' ? 'Present' : value) : 'MISSING!'}`);
        if (!value) {
            allRequiredVarsPresent = false;
            missingVarMessages.push(`${key} is missing or unresolved.`);
        }
    }

    for (const [key, value] of Object.entries(customRequiredVarKeys)) {
        log(`${key}: ${value ? 'Present' : 'MISSING!'}`);
        if (!value) {
            allRequiredVarsPresent = false;
            missingVarMessages.push(`${key} is missing.`);
        }
    }

    if (!allRequiredVarsPresent) {
        const errorMsg = `Missing one or more required environment variables: ${missingVarMessages.join('; ')}`;
        logError(`❌ ERROR: ${errorMsg}`);
        return res.json({ success: false, error: errorMsg }, 500);
    }

    // 3) Initialize Appwrite SDK
    const client = new Client(); // Use destructured Client
    const databases = new Databases(client); // Use destructured Databases
    const messaging = new Messaging(client); // Use destructured Messaging

    try {
        client
            .setEndpoint(endpointToUse)
            .setProject(projectIdToUse)
            .setKey(apiKeyToUse);
        log("✅ Appwrite client initialized successfully with determined endpoint and project ID.");

        // 4) Fetch AdminSettings document
        log(
            `Fetching admin settings from collection '${APPWRITE_ADMIN_SETTINGS_COLLECTION_ID}', doc ID: '${ADMIN_SETTINGS_DOCUMENT_ID}'`
        );
        const settingsDoc = await databases.getDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_ADMIN_SETTINGS_COLLECTION_ID,
            ADMIN_SETTINGS_DOCUMENT_ID
        );
        log("✅ Admin settings fetched successfully.");

        const {
            firstReminderDay,
            secondReminderDay,
            dueDayLogic,
            adminContactPhone,
            adminContactEmail,
            paymentInstructions,
            currencySymbol = "₹"
        } = settingsDoc;

        if (
            typeof firstReminderDay !== "number" ||
            typeof secondReminderDay !== "number" ||
            !dueDayLogic
        ) {
            const errorMsg = "Admin settings for reminders are invalid or missing from the settings document.";
            logError(`❌ ERROR: ${errorMsg} (firstReminderDay: ${firstReminderDay}, secondReminderDay: ${secondReminderDay}, dueDayLogic: ${dueDayLogic})`);
            return res.json({ success: false, error: errorMsg }, 500);
        }

        log(`Using settings from DB: ${JSON.stringify({ firstReminderDay, secondReminderDay, dueDayLogic, currencySymbol })}`);

        const today = new Date();
        const currentDayOfMonth = today.getDate();
        const currentMonthIndex = today.getMonth();
        const currentYear = today.getFullYear();
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        let paymentMonthIndexTarget = currentMonthIndex + 1;
        let yearForPaymentTarget = currentYear;
        if (paymentMonthIndexTarget > 11) {
            paymentMonthIndexTarget = 0;
            yearForPaymentTarget = currentYear + 1;
        }
        const paymentMonthNameTarget = monthNames[paymentMonthIndexTarget];

        let dueDateObject;
        if (dueDayLogic === "1st_of_next_month") {
            dueDateObject = new Date(yearForPaymentTarget, paymentMonthIndexTarget, 1);
        } else if (dueDayLogic === "last_day_of_current_month") {
            const lastDayCurrentMonth = getLastDayOfMonth(currentYear, currentMonthIndex);
            dueDateObject = new Date(currentYear, currentMonthIndex, lastDayCurrentMonth);
        } else {
            dueDateObject = new Date(yearForPaymentTarget, paymentMonthIndexTarget, 1);
            (logError || log)(
                `⚠️ WARNING: Unknown dueDayLogic: '${dueDayLogic}'. Defaulting due date to 1st of ${paymentMonthNameTarget}.`
            );
        }
        const dueDateStringForEmail = formatDateForEmailDisplay(dueDateObject);
        const paymentCheckYear = yearForPaymentTarget;
        const paymentCheckMonth = paymentMonthNameTarget;

        log(
            `Today: ${currentDayOfMonth} ${monthNames[currentMonthIndex]} ${currentYear}. ` +
            `Checking for ${paymentCheckMonth} ${paymentCheckYear} rent (due around ${dueDateStringForEmail}).`
        );

        // 6) Fetch all Active tenancies
        log("Fetching 'Active' tenancies...");
        const tenanciesResponse = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            APPWRITE_TENANCIES_COLLECTION_ID, [
                Query.equal("status", "Active") // CORRECTED
            ]
        );

        if (tenanciesResponse.total === 0) {
            log("No active tenancies found. Exiting.");
            return res.json({ success: true, message: "No active tenancies to process." });
        }

        log(`Found ${tenanciesResponse.total} active tenancies.`);
        const userIds = [...new Set(tenanciesResponse.documents.map(t => t.userId))];
        let profilesMap = new Map();

        if (userIds.length > 0) {
            log(`Fetching profiles for ${userIds.length} unique user IDs.`);
            const profilesPromises = [];
            const chunkSize = 100;
            for (let i = 0; i < userIds.length; i += chunkSize) {
                const chunk = userIds.slice(i, i + chunkSize);
                profilesPromises.push(databases.listDocuments(
                    APPWRITE_DATABASE_ID,
                    APPWRITE_PROFILES_COLLECTION_ID, [
                        Query.equal("userId", chunk), // CORRECTED (was Query.in)
                        Query.limit(chunk.length) // CORRECTED
                    ]
                ));
            }
            const profilesResponses = await Promise.all(profilesPromises);
            profilesResponses.forEach(response => {
                response.documents.forEach(p => profilesMap.set(p.userId, p));
            });
            log(`Fetched ${profilesMap.size} profiles.`);
        }

        let emailsSentCount = 0;
        let remindersToSend = [];

        for (const tenancy of tenanciesResponse.documents) {
            const userProfile = profilesMap.get(tenancy.userId);
            if (!userProfile || !userProfile.email) {
                (logError || log)(`⚠️ WARNING: Skipping tenancy ${tenancy.$id}: no profile or email for userId ${tenancy.userId}.`);
                continue;
            }
            const paidMonthsForTenancyYear = tenancy.paidMonths || [];
            const paymentYearFromTenancy = tenancy.paymentYear || 0;
            const isTargetMonthPaid =
                paymentYearFromTenancy === paymentCheckYear &&
                paidMonthsForTenancyYear.includes(paymentCheckMonth);

            if (isTargetMonthPaid) {
                log(
                    `Rent for ${paymentCheckMonth} ${paymentCheckYear} is PAID by ${userProfile.email} (Tenancy: ${tenancy.$id}). No reminder needed.`
                );
                continue;
            }

            let emailSubject = "";
            let emailBody = "";

            if (currentDayOfMonth === firstReminderDay) {
                emailSubject = `Friendly Reminder: Your Rent for ${paymentCheckMonth} is Due Soon!`;
                emailBody =
                    `Hi ${userProfile.name || "Tenant"},\n\n` +
                    `This is a friendly reminder that your rent of ${currencySymbol}${tenancy.rentAmount || 'N/A'} ` +
                    `for ${tenancy.occupancyName || 'your room'} - ${tenancy.tierName || ''} at ${tenancy.sanityPropertyName || "your property"} ` +
                    `for ${paymentCheckMonth}, ${paymentCheckYear} is due by ${dueDateStringForEmail}.\n\n` +
                    `${paymentInstructions || "Please make your payment at your earliest convenience."}\n\n` +
                    `If you've already paid, please disregard this message. Thank you!\n\n` +
                    `Best regards,\nThe Hubode Management Team\nContact: ${adminContactEmail || ""} / ${adminContactPhone || ""}`;
            } else if (currentDayOfMonth === secondReminderDay) {
                emailSubject = `Important: Your Rent for ${paymentCheckMonth} is Now Due`;
                emailBody =
                    `Hi ${userProfile.name || "Tenant"},\n\n` +
                    `Your rent of ${currencySymbol}${tenancy.rentAmount || 'N/A'} ` +
                    `for ${tenancy.occupancyName || 'your room'} - ${tenancy.tierName || ''} at ${tenancy.sanityPropertyName || "your property"} ` +
                    `for ${paymentCheckMonth}, ${paymentCheckYear} is due by ${dueDateStringForEmail}.\n\n` +
                    `If payment has not been made, please ${paymentInstructions || "submit it promptly to avoid issues"}.\n\n` +
                    `If you've recently paid, thank you, and please allow time for processing.\n\n` +
                    `Questions? Contact us at ${adminContactEmail || ""} / ${adminContactPhone || ""}.\n\n` +
                    `Sincerely,\nThe Hubode Management Team`;
            }

            if (emailSubject) {
                remindersToSend.push({
                    to: userProfile.email,
                    subject: emailSubject,
                    body: emailBody,
                    tenantName: userProfile.name || 'Tenant',
                    tenancyId: tenancy.$id
                });
            }
        }

        if (remindersToSend.length === 0) {
            log("No reminders to send today based on current date and payment statuses.");
            return res.json({ success: true, message: "No reminders to send today." });
        }

        log(`Attempting to send ${remindersToSend.length} reminder emails...`);
        for (const reminder of remindersToSend) {
            try {
                await messaging.createEmail(
                    ID.unique(), // Use destructured ID
                    reminder.subject,
                    reminder.body, [reminder.to], [], // cc
                    [], // bcc
                    false, // html
                    [] // attachments
                );
                emailsSentCount++;
                log(`✅ Email sent successfully to ${reminder.to} (tenancy ${reminder.tenancyId}).`);
            } catch (emailError) {
                logError(
                    `❌ Failed to send email to ${reminder.to} for tenancy ${reminder.tenancyId}:`
                );
                logError(emailError instanceof Error ? emailError.toString() : emailError); // Check generic Error
            }
        }

        log(
            `Rent reminder process completed. ${emailsSentCount} of ${remindersToSend.length} emails sent successfully.`
        );
        return res.json({ success: true, message: `Process completed. ${emailsSentCount} emails sent.` });

    } catch (e) {
        logError("❌ FATAL ERROR in SendRentReminders function:");
        logError(e);
        const errorMessage = (e instanceof Error) ? e.toString() : (e.message || "An unknown error occurred."); // Check generic Error
        return res.json({ success: false, error: "Function execution failed due to an internal error.", details: errorMessage }, 500);
    }
};