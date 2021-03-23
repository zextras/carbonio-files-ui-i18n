import { hooks } from '@zextras/zapp-shell';

const useUserInfo: () => { me: string } = () => {
	// TODO: userAccounts return an array of accounts. I'm interest in the active one. For now I suppose it's the first
	const userAccounts = hooks.useUserAccounts();

	return {
		me: userAccounts[0].id
	};
};

export default useUserInfo;
