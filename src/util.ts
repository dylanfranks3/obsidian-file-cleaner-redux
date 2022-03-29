import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
} from "obsidian";
import { FileCleanerSettings } from "./settings";
import { t } from "./translations/helper";

export const clearFiles = async (app: App, setting: FileCleanerSettings) => {
	// 获取空白Markdown文件
	let mdFiles = app.vault.getMarkdownFiles();
	let emptyMdFiles: TFile[] = [];
	let emptyRegex = /\S/;
	for (let file of mdFiles) {
		let content = await app.vault.cachedRead(file);
		if (file.stat.size === 0) {
			emptyMdFiles.push(file);
		} else if (!emptyRegex.test(content)) {
			emptyMdFiles.push(file);
		}
	}

	// 获取未使用附件
	let files = app.vault.getFiles();
	const attachmentRegex = /(.jpg|.jpeg|.png|.gif|.svg|.pdf)$/i;
	let attachments: TFile[] = [];
	for (let file of files) {
		if (file.name.match(attachmentRegex)) {
			attachments.push(file);
		}
	}

	let usedAttachments: any = [];
	let resolvedLinks = app.metadataCache.resolvedLinks;
	if (resolvedLinks) {
		for (const [mdFile, links] of Object.entries(resolvedLinks)) {
			for (const [path, times] of Object.entries(resolvedLinks[mdFile])) {
				let attachmentMatch = path.match(attachmentRegex);
				if (attachmentMatch) {
					let file = app.vault.getAbstractFileByPath(path);
					usedAttachments.push(file);
				}
			}
		}
	}

	let unusedAttachments = attachments.filter(
		(file) => !usedAttachments.includes(file)
	);

	// 获取清理文件列表
	let cleanFiles: TFile[] = [...emptyMdFiles, ...unusedAttachments];

	// 执行清理
	let len = cleanFiles.length;
	if (len > 0) {
		let destination = setting.destination;
		for (let file of cleanFiles) {
			console.log(file.name + " cleaned");
			if (destination === "permanent") {
				await app.vault.delete(file);
			} else if (destination === "system") {
				await app.vault.trash(file, true);
			} else if (destination === "obsidian") {
				await app.vault.trash(file, false);
			}
		}
		new Notice(t("Clean successful"));
	} else {
		new Notice(t("No file to clean"));
	}
};