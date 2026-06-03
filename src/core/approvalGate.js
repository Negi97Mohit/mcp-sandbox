/**
 * approvalGate.ts — Human-in-the-loop approval system.
 *
 * When the Orchestrator wants to perform a HIGH or CRITICAL risk action,
 * it calls approvalGate.request(). The gate:
 *   1. Posts a Discord embed showing the proposed action + risk level
 *   2. Adds ✅ and ❌ reaction buttons
 *   3. PAUSES execution (returns a Promise that suspends the agent)
 *   4. Resolves when a human reacts, or times out after `timeoutMs`
 *
 * This implements the EU AI Act Article 14 pattern: high-risk automated
 * actions have mandatory human oversight before execution.
 */
import { EmbedBuilder, Message, TextChannel } from "discord.js";
import { client } from "../discord/client.js";
import { riskClassifier } from "./riskClassifier.js";
const APPROVE_EMOJI = "✅";
const REJECT_EMOJI = "❌";
// Pending approvals: request ID → resolver function
const pendingApprovals = new Map();
// Message ID → approval request ID mapping (for reaction handling)
const messageToApproval = new Map();
export class ApprovalGate {
    /**
     * Request human approval for a high-risk action.
     * This function SUSPENDS until the human reacts or the timeout fires.
     */
    async request(req) {
        const startTime = Date.now();
        const channel = client.channels.cache.get(req.channelId);
        if (!channel) {
            console.warn("⚠️ ApprovalGate: channel not found, auto-rejecting");
            return { outcome: "rejected", elapsedMs: 0 };
        }
        const risk = riskClassifier.classify(req.action);
        const emoji = riskClassifier.getRiskEmoji(req.riskLevel);
        // Build rich approval embed
        const embed = new EmbedBuilder()
            .setTitle(`${emoji} Human Approval Required`)
            .setColor(req.riskLevel === "critical" ? 0xff0000 : 0xff8c00)
            .addFields({ name: "⚡ Proposed Action", value: `\`\`\`${req.action}\`\`\`` }, { name: "🎯 Risk Level", value: `**${req.riskLevel.toUpperCase()}** — ${risk.reason}`, inline: true }, { name: "👤 Requested By", value: `<@${req.requestedBy}>`, inline: true }, { name: "📋 Reason", value: req.reason })
            .setFooter({ text: `Timeout in ${Math.round(req.timeoutMs / 1000)}s • React ✅ to approve or ❌ to reject` })
            .setTimestamp();
        if (req.context) {
            embed.addFields({ name: "📄 Context", value: req.context.substring(0, 1024) });
        }
        const approvalMsg = await channel.send({
            content: `🛑 **Action paused for approval** | Request ID: \`${req.id}\``,
            embeds: [embed],
        });
        // Add reaction buttons
        await approvalMsg.react(APPROVE_EMOJI);
        await approvalMsg.react(REJECT_EMOJI);
        // Register for reaction handling
        messageToApproval.set(approvalMsg.id, req.id);
        return new Promise((resolve) => {
            pendingApprovals.set(req.id, resolve);
            // Auto-reject on timeout
            setTimeout(() => {
                if (pendingApprovals.has(req.id)) {
                    pendingApprovals.delete(req.id);
                    messageToApproval.delete(approvalMsg.id);
                    approvalMsg.edit({
                        content: `⏰ **Approval timed out** — action was automatically rejected.`,
                        embeds: [embed.setColor(0x808080).setFooter({ text: "Timed out" })],
                    }).catch(() => { });
                    resolve({ outcome: "timeout", elapsedMs: Date.now() - startTime });
                }
            }, req.timeoutMs);
        });
    }
    /**
     * Called by the Discord client's messageReactionAdd event handler.
     * Resolves the pending approval if the reactor is an admin.
     */
    async handleReaction(messageId, emoji, userId, isAdmin) {
        const approvalId = messageToApproval.get(messageId);
        if (!approvalId)
            return false;
        // Only admins can approve/reject
        if (!isAdmin)
            return false;
        const resolver = pendingApprovals.get(approvalId);
        if (!resolver)
            return false;
        pendingApprovals.delete(approvalId);
        messageToApproval.delete(messageId);
        const outcome = emoji === APPROVE_EMOJI ? "approved" : "rejected";
        resolver({ outcome, approvedBy: userId, elapsedMs: 0 });
        return true;
    }
    /** Generate a unique approval request ID */
    generateId() {
        return `apr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    }
}
export const approvalGate = new ApprovalGate();
//# sourceMappingURL=approvalGate.js.map