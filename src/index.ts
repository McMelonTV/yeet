import { ActionRowBuilder, Client, Events, GatewayIntentBits, ModalBuilder, REST, Routes, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { config } from 'dotenv';

config();

const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN!);

(async () => {
	try {
		console.log(`setting commands`);

		const data = await rest.put(
			Routes.applicationCommands('1231621963357753469'),
			{
				body: [
					new SlashCommandBuilder()
						.setName('ban')
						.setDescription('Opens a modal for banning multiple users.')
						.setDMPermission(false),
				]
			},
		);

		console.log(`successfully set commands`);
	} catch (error) {
		console.error(error);
	}
})();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready on ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
	try {
		if (interaction.isChatInputCommand()) {
			const { commandName, user } = interaction;

			if (commandName === 'ban') {
				const userIdInput = new TextInputBuilder()
					.setLabel('User IDs')
					.setCustomId('user_ids_input')
					.setPlaceholder('Enter user IDs separated by commas, newlines, or spaces. Alternatively, a JSON array of user IDs.')
					.setRequired(true)
					.setPlaceholder(user.id)
					.setStyle(TextInputStyle.Paragraph);

				const reasonInput = new TextInputBuilder()
					.setLabel('Reason')
					.setCustomId('reason_input')
					.setPlaceholder('Enter the reason for banning the users.')
					.setRequired(false)
					.setStyle(TextInputStyle.Short);

				const actionRowUserId = new ActionRowBuilder<TextInputBuilder>()
					.addComponents([userIdInput]);

				const actionRowReason = new ActionRowBuilder<TextInputBuilder>()
					.addComponents([reasonInput]);

				const modal = new ModalBuilder()
					.setTitle('Ban Users')
					.setCustomId('ban_modal')
					.addComponents([
						actionRowUserId,
						actionRowReason,
					])

				await interaction.showModal(modal);
			}
		} else if (interaction.isModalSubmit()) {
			const { guild, customId } = interaction;

			if (customId !== 'ban_modal') return;

			const banMembers = interaction.fields.getTextInputValue('user_ids_input');
			const reason = interaction.fields.getTextInputValue('reason_input');

			let banMembersArray: string[] = [];
			try {
				banMembersArray = JSON.parse(banMembers);
			} catch (error) {
				banMembersArray = banMembers.split(/,|\s/);
			}

			console.log(`Banning ${banMembersArray.length} users in guild ${guild?.name}${reason ? ` with reason: ${reason}` : ''}.`);
			await interaction.reply({ content: `Banning ${banMembersArray.length} users.${reason ? ` Reason: ${reason}` : ''}`, ephemeral: true });

			await Promise.all(banMembersArray.map(member => guild!.members.ban(member, { reason })))

			await interaction.followUp({ content: `Banned ${banMembersArray.length} users successfully${reason ? ` with reason: ${reason}` : ''}.`, ephemeral: true });
		}
	} catch (error) {
		console.error(error);
	}
});

client.login(process.env.DISCORD_BOT_TOKEN);