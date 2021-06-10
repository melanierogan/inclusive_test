const core = require('@actions/core');
const github = require('@actions/github');
const unfriendlyWords = [
	'whitelist',
	'blacklist',
	'simply',
	'master',
	'slave',
	'just',
	'guys',
	'obviously',
	'sane',
	'banana',
];

const run = async () => {
	try {
		console.log('START OF TRY');
		const token = core.getInput('github_token');
		const message = core.getInput('message');
		console.log(token, '<<< does this work?');
		const octokit = new github.getOctokit(token);

		// console.log(github.context, 'what is the context');
		console.log('GOT OCTOKIT AND GITHUB CONTEXT SHOULD BE ABOVE THIS');
		// const { repo, payload } = github.context;
		// const owner = payload.repository.owner.login;
		// const pull_number = payload.number;
		// const pull_number = 32;
		// const repoName = repo.repo;

		const { data: pullRequest } = await octokit.pulls.get({
			owner: 'melanierogan',
			repo: 'inclusivebot-workshop',
			pull_number: 32,
		});
		//this now works
		//TODO
		//Get files patch and use that as data for spliting down by those lines added
		//THEN try to get owner, repo and pull number put in dynamically
		//THEN tidy up messaging
		//THEN tidy up steps to recap

		// console.log(pullRequest, 'the pull request <<<<<');
		const files = await octokit.rest.pulls.listFiles({
			owner: 'melanierogan',
			repo: 'inclusivebot-workshop',
			pull_number: 43,
		});

		const checkCommit = files.data[0].patch.split('\n');
		console.log(checkCommit, '<<< WHAT IS IN THIS COMMIT');
		const onlyAddedLines = line => {
			return line.startsWith('+');
		};
		const removeFirstPlus = line => {
			return line.substring(1);
		};
		const extractBadWords = (ExtractedBadWordsArray, line) => {
			for (const unfriendlyWord of unfriendlyWords) {
				if (line.includes(unfriendlyWord)) {
					ExtractedBadWordsArray.push({
						word: unfriendlyWord,
						line: line,
						index: line.indexOf(unfriendlyWord),
						status: true,
						count: ExtractedBadWordsArray.length,
					});
				}
			}
			return ExtractedBadWordsArray;
		};
		console.log(extractBadWords, '<<< WHAT ARE THE BAD WORDS THAT WERE FOUND');
		console.log('START OF RESULT WITH REDUCE');

		const result = checkCommit
			.filter(onlyAddedLines)
			.map(removeFirstPlus)
			.reduce(extractBadWords, []);

		const wordsFound = result.map(function(el) {
			return el.word;
		});

		const linesFound = result.map(function(el) {
			return el.line;
		});

		const isUnfriendlyComment = `💔 This PR contains some non inclusive or unfriendly terms.
				The following words were found: ${wordsFound}
				These words were found on the following lines: ${linesFound}`;
		console.log(wordsFound, '<<< WHAT WORDS');
		console.log(linesFound, '<<< WHAT LINES');
		console.log(result, '<<< WHAT IS THE RESULT?');
		const newComment = await octokit.issues.createComment({
			owner: 'melanierogan',
			repo: 'inclusivebot-workshop',
			issue_number: 59,
			body: isUnfriendlyComment,
		});
		if (result[0].status) {
			console.log('WE OUT HERE');
			newComment;
		}

		return 'banana';
	} catch (error) {
		core.setFailed(error.message);
	}
};

run();
