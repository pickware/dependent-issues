// Ours
import { ActionContext, Dependency } from './types';

import {
	IssueManager,
	DependencyResolver,
	DependencyExtractor,
} from './helpers';

export async function checkIssues(context: ActionContext) {
	const { client, config, repo } = context;

	const manager = new IssueManager(client, repo, config);
	const extractor = new DependencyExtractor(repo, config.keywords);
	const resolver = new DependencyResolver(client, context.issues, repo);

	for (const issue of context.issues) {
		const dependencies = extractor.fromIssue(issue);

		const dependencyIssues = await Promise.all(
			dependencies.map(resolver.get)
		);

		const blockers = dependencyIssues
			.filter((depIssue) => depIssue.state === 'open')
			.map((iss) => ({ ...repo, number: iss.number } as Dependency));

		// Toggle label
		blockers.length === 0
			? await manager.removeLabel(issue)
			: await manager.addLabel(issue);

		await manager.updateCommitStatus(issue, blockers);
	}
}
