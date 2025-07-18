import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InstallationUpdateRequest {
  customerEmail: string;
  customerName: string;
  installationNumber: string;
  status: string;
  milestone?: string;
  nextStep?: string;
  scheduledDate?: string;
  completedDate?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      customerEmail, 
      customerName, 
      installationNumber, 
      status, 
      milestone,
      nextStep,
      scheduledDate,
      completedDate 
    }: InstallationUpdateRequest = await req.json();

    let subject = "";
    let content = "";

    // Generate email content based on status/milestone
    switch (status) {
      case "scheduled":
        subject = `Installation Scheduled - ${installationNumber}`;
        content = `
          <h1>Your Solar Installation Has Been Scheduled!</h1>
          <p>Dear ${customerName},</p>
          <p>Great news! Your solar installation has been scheduled.</p>
          <ul>
            <li><strong>Installation Number:</strong> ${installationNumber}</li>
            <li><strong>Scheduled Date:</strong> ${scheduledDate || 'TBD'}</li>
          </ul>
          <p>Our installation team will contact you 24-48 hours before the scheduled date to confirm timing and prepare for the installation.</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
        `;
        break;
      
      case "in_progress":
        subject = `Installation Update - ${installationNumber}`;
        content = `
          <h1>Installation Progress Update</h1>
          <p>Dear ${customerName},</p>
          <p>We wanted to update you on the progress of your solar installation.</p>
          <ul>
            <li><strong>Installation Number:</strong> ${installationNumber}</li>
            <li><strong>Current Status:</strong> ${milestone || 'In Progress'}</li>
            ${nextStep ? `<li><strong>Next Step:</strong> ${nextStep}</li>` : ''}
          </ul>
          <p>Your installation is progressing well and we'll keep you updated on any significant milestones.</p>
        `;
        break;
      
      case "completed":
        subject = `Installation Complete - ${installationNumber}`;
        content = `
          <h1>🎉 Your Solar Installation is Complete!</h1>
          <p>Dear ${customerName},</p>
          <p>Congratulations! Your solar installation has been successfully completed.</p>
          <ul>
            <li><strong>Installation Number:</strong> ${installationNumber}</li>
            <li><strong>Completion Date:</strong> ${completedDate || new Date().toLocaleDateString()}</li>
          </ul>
          <p>Your system is now ready to start generating clean, renewable energy for your home!</p>
          <p>What's next:</p>
          <ul>
            <li>Utility interconnection (if not already complete)</li>
            <li>System monitoring setup</li>
            <li>Final paperwork and warranty information</li>
          </ul>
          <p>Thank you for choosing solar energy and trusting us with your installation!</p>
        `;
        break;
      
      default:
        subject = `Installation Update - ${installationNumber}`;
        content = `
          <h1>Installation Update</h1>
          <p>Dear ${customerName},</p>
          <p>We have an update regarding your solar installation.</p>
          <ul>
            <li><strong>Installation Number:</strong> ${installationNumber}</li>
            <li><strong>Status:</strong> ${status}</li>
            ${milestone ? `<li><strong>Milestone:</strong> ${milestone}</li>` : ''}
          </ul>
          <p>We'll continue to keep you updated on your installation progress.</p>
        `;
    }

    const emailResponse = await resend.emails.send({
      from: "SolarBiz <installations@solarbiz.com>",
      to: [customerEmail],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${content}
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            <strong>SolarBiz Installation Team</strong><br>
            Phone: (555) 123-4567<br>
            Email: installations@solarbiz.com
          </p>
        </div>
      `,
    });

    console.log("Installation update email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-installation-update function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);