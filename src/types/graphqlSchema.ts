/* eslint-disable camelcase,no-shadow */
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
	ID: string;
	String: string;
	Boolean: boolean;
	Int: number;
	Float: number;
	/** A custom scalar representing a date in a timestamp format */
	DateTime: any;
};

/**  Definition of the Node interface */
export type Node = {
	/**  Node creation timestamp */
	created_at?: Scalars['DateTime'];
	/**  Creator of the node (it will be a User type when it will be implemented) */
	creator?: User;
	/**  Description of the file/folder */
	description?: Scalars['String'];
	/**  Univoque identifier of the node */
	id: Scalars['ID'];
	/**  Last user who has edited the node (it will be a User type when it will be implemented) */
	last_editor?: Maybe<User>;
	link?: Maybe<Link>;
	/**  True if the user has marked the node for future deletion, false otherwise */
	marked_for_deletion?: Scalars['Boolean'];
	/**  Name of the file/folder */
	name: Scalars['String'];
	/**  Owner of the node (it will be a User type when it will be implemented) */
	owner?: User;
	/**  Parent folder containing the node. The parent can be null when the current node is the root folder */
	parent?: Maybe<Node>;
	/**  Node permissions of the user making the request */
	permissions?: Permissions;
	/**  Specific share of the current node with the target user (if exists) */
	share?: Maybe<Share>;
	/**  List of shares of the current node (if they exist) */
	shares?: Array<Maybe<Share>>;
	/**  True if the owner has marked the node as favourite, false otherwise */
	starred?: Scalars['Boolean'];
	/**  Type of the node */
	type?: Scalars['String'];
	/**  Node update timestamp */
	updated_at?: Scalars['DateTime'];
	__typename?: 'Node' | 'File' | 'Folder' | string;
};


/**  Definition of the Node interface */
export type NodeShareArgs = {
	target_user_id: Scalars['ID'];
};


/**  Definition of the Node interface */
export type NodeSharesArgs = {
	cursor?: Maybe<Scalars['String']>;
	limit: Scalars['Int'];
	sorts?: Maybe<Array<ShareSort>>;
};

/**  Definition of the File type which implements the Node interface */
export type File = Node & {
	__typename?: 'File';
	/**  File creation timestamp */
	created_at?: Scalars['DateTime'];
	/**  Creator of the file */
	creator?: User;
	/**  Description of the file */
	description?: Scalars['String'];
	/**  Univoque identifier of the file */
	id: Scalars['ID'];
	/**  Last user who has edited the file */
	last_editor?: Maybe<User>;
	link?: Maybe<Link>;
	/**  True if the user has marked the folder for future deletion, false otherwise */
	marked_for_deletion?: Scalars['Boolean'];
	/**  Mime type of the file */
	mime_type?: Scalars['String'];
	/**  Name of the file */
	name: Scalars['String'];
	/**  Owner of the file */
	owner?: User;
	/**  Parent folder containing the file */
	parent?: Node;
	/**  File permissions of the user making the request */
	permissions?: Permissions;
	/**  Specific share of the current file with the target user (if exists) */
	share?: Maybe<Share>;
	/**  List of shares of the current file (if they exist) */
	shares?: Array<Maybe<Share>>;
	/**  Size of the file */
	size?: Scalars['Int'];
	/**  True if the owner has marked the folder as favourite, false otherwise */
	starred?: Scalars['Boolean'];
	/**  Type of the node */
	type?: Scalars['String'];
	/**  File update timestamp */
	updated_at?: Scalars['DateTime'];
	/**  Version of the file */
	version?: Scalars['Int'];
};


/**  Definition of the File type which implements the Node interface */
export type FileShareArgs = {
	target_user_id: Scalars['ID'];
};


/**  Definition of the File type which implements the Node interface */
export type FileSharesArgs = {
	cursor?: Maybe<Scalars['String']>;
	limit: Scalars['Int'];
	sorts?: Maybe<Array<ShareSort>>;
};

/**  Definition of the Folder type which implements the Node interface */
export type Folder = Node & {
	__typename?: 'Folder';
	/**  List of all child nodes of a folder. */
	children?: Array<Maybe<Node>>;
	/**  Folder creation timestamp */
	created_at?: Scalars['DateTime'];
	/**  Creator of the folder */
	creator?: User;
	/**  Description of the folder */
	description?: Scalars['String'];
	/**  Univoque identifier of the folder */
	id: Scalars['ID'];
	/**  Last user who has edited the folder */
	last_editor?: Maybe<User>;
	link?: Maybe<Link>;
	/**  True if the user has marked the folder for future deletion, false otherwise */
	marked_for_deletion?: Scalars['Boolean'];
	/**  Name of the folder */
	name: Scalars['String'];
	/**  Owner of the folder */
	owner?: User;
	/**  Parent folder containing the folder. The parent can be null when the current folder is the root */
	parent?: Maybe<Node>;
	/**  Folder permissions of the user making the request */
	permissions?: Permissions;
	/**  Specific share of the current folder with the target user (if exists) */
	share?: Maybe<Share>;
	/**  List of shares of the current folder (if they exist) */
	shares?: Array<Maybe<Share>>;
	/**  True if the owner has marked the folder as favourite, false otherwise */
	starred?: Scalars['Boolean'];
	/**  Type of the node */
	type?: Scalars['String'];
	/**  Folder update timestamp */
	updated_at?: Scalars['DateTime'];
};


/**  Definition of the Folder type which implements the Node interface */
export type FolderChildrenArgs = {
	cursor?: Maybe<Scalars['String']>;
	limit: Scalars['Int'];
	sorts?: Maybe<Array<NodeSort>>;
};


/**  Definition of the Folder type which implements the Node interface */
export type FolderShareArgs = {
	target_user_id: Scalars['ID'];
};


/**  Definition of the Folder type which implements the Node interface */
export type FolderSharesArgs = {
	cursor?: Maybe<Scalars['String']>;
	limit: Scalars['Int'];
	sorts?: Maybe<Array<ShareSort>>;
};

/**  Definition of the Link type. It represents a public or private link of a specific node. */
export type Link = {
	__typename?: 'Link';
	/**  Link creation timestamp */
	created_at: Scalars['DateTime'];
	/**  Link expiration timestamp */
	expires_at?: Maybe<Scalars['DateTime']>;
	/**  Node related to this link. */
	node: Node;
	/**  Link password. If enabled, only the user that know the password can access the node. */
	password?: Maybe<Scalars['String']>;
	/**
	 * Represents the visibility of the link. If it is public then everybody can access the related node,
	 * otherwise the node can be accessed only by the users to whom it was shared.
	 */
	public: Scalars['Boolean'];
	/**  Full url to access the related node. Every node has one and only one url. */
	url: Scalars['String'];
};

export type Mutation = {
	__typename?: 'Mutation';
	/**  <strong>Creates a new folder</strong> */
	createFolder: Node;
	/**
	 * Allows to create a public/private link for an existing node.
	 * Optionally, an expiration timestamp and/or a password can be set.
	 */
	createLink: Link;
	/**
	 * Allows to share an existing node to a user specifing the user permissions on that node,
	 * and, optionally, an expiration timestamp.
	 */
	createShare: Share;
	/**
	 * Allows to delete a link of a node. It returns false if the link does not exist or the operation fails,
	 * otherwise it returns true.
	 */
	deleteLink: Scalars['Boolean'];
	/**  Allows to delete a list of nodes. For each node you can optionally specify a version for a file. */
	deleteNodes?: Maybe<Array<Scalars['ID']>>;
	/**
	 * Allows to delete the share of a node to a target user. It returns false if the share does not exist or the operation
	 * fails, otherwise it returns true.
	 */
	deleteShare: Scalars['Boolean'];
	/**  Allows to mark for deletion a list of nodes. */
	markNodesForDeletion?: Maybe<Array<Scalars['ID']>>;
	/**  Allows to move a list of nodes into a folder destination. This operation requires write permissions on the destination folder otherwise it fails. */
	moveNodes?: Maybe<Array<Node>>;
	/**  Allows to star a list of nodes. */
	starNodes?: Maybe<Array<Scalars['ID']>>;
	/**  Allows to update the visibility, the expiration timestamp and/or the password of an existing link. */
	updateLink?: Maybe<Link>;
	/**  <strong>Update an existing node</strong> */
	updateNode: Node;
	/**  Allows to update the SharePermissions and the expiration timestamp of an existing share. */
	updateShare?: Maybe<Share>;
};


export type MutationCreateFolderArgs = {
	name: Scalars['String'];
	parent_id: Scalars['String'];
};


export type MutationCreateLinkArgs = {
	expires_at?: Maybe<Scalars['DateTime']>;
	node_id: Scalars['ID'];
	password?: Maybe<Scalars['String']>;
	public: Scalars['Boolean'];
};


export type MutationCreateShareArgs = {
	expires_at?: Maybe<Scalars['DateTime']>;
	node_id: Scalars['ID'];
	permissions: SharePermissions;
	target_user_id: Scalars['ID'];
};


export type MutationDeleteLinkArgs = {
	node_id: Scalars['ID'];
};


export type MutationDeleteNodesArgs = {
	nodes?: Maybe<Array<NodeInput>>;
};


export type MutationDeleteShareArgs = {
	node_id: Scalars['ID'];
	target_user_id: Scalars['ID'];
};


export type MutationMarkNodesForDeletionArgs = {
	mark_for_deletion: Scalars['Boolean'];
	nodes_ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationMoveNodesArgs = {
	destination_id: Scalars['ID'];
	nodes_ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationStarNodesArgs = {
	nodes_ids?: Maybe<Array<Scalars['ID']>>;
	star: Scalars['Boolean'];
};


export type MutationUpdateLinkArgs = {
	expires_at?: Maybe<Scalars['DateTime']>;
	node_id: Scalars['ID'];
	password?: Maybe<Scalars['String']>;
	public?: Maybe<Scalars['Boolean']>;
};


export type MutationUpdateNodeArgs = {
	description?: Maybe<Scalars['String']>;
	id: Scalars['String'];
	marked_for_deletion?: Maybe<Scalars['Boolean']>;
	name?: Maybe<Scalars['String']>;
	starred?: Maybe<Scalars['Boolean']>;
};


export type MutationUpdateShareArgs = {
	expires_at?: Maybe<Scalars['DateTime']>;
	node_id: Scalars['ID'];
	permissions?: Maybe<SharePermissions>;
	target_user_id: Scalars['ID'];
};

export type NodeSubscription = {
	__typename?: 'NodeSubscription';
	/**  Node creation timestamp */
	created_at: Scalars['DateTime'];
	/**  Description of the file/folder */
	description: Scalars['String'];
	/**  Univoque identifier of the node */
	id: Scalars['ID'];
	/**  True if the user has marked the node for future deletion, false otherwise */
	marked_for_deletion: Scalars['Boolean'];
	/**  Name of the file/folder */
	name: Scalars['String'];
	/**  True if the owner has marked the node as favourite, false otherwise */
	starred: Scalars['Boolean'];
	/**  Type of the node */
	type: Scalars['String'];
	/**  Node update timestamp */
	updated_at: Scalars['DateTime'];
};

/**  Definition of Permissions type. It represents all the permissions that the requester user has on a specific node. */
export type Permissions = {
	__typename?: 'Permissions';
	can_add_version: Scalars['Boolean'];
	can_change_description: Scalars['Boolean'];
	can_change_link: Scalars['Boolean'];
	can_change_share: Scalars['Boolean'];
	can_change_star: Scalars['Boolean'];
	can_copy: Scalars['Boolean'];
	can_delete: Scalars['Boolean'];
	can_mark_for_deletion: Scalars['Boolean'];
	can_move: Scalars['Boolean'];
	can_read_link: Scalars['Boolean'];
	can_read_share: Scalars['Boolean'];
	can_rename: Scalars['Boolean'];
	can_share: Scalars['Boolean'];
	can_upload: Scalars['Boolean'];
};

export type Query = {
	__typename?: 'Query';
	getFileVersions: Array<Maybe<File>>;
	/**  Returns the attributes of a link of the specified node */
	getLink?: Maybe<Link>;
	/**  <strong>Returns the attributes of the node specified by ID</strong> */
	getNode?: Maybe<Node>;
	/**  Returns the attributes of the specified share */
	getShare?: Maybe<Share>;
	getUserByEmail?: Maybe<User>;
	getUserById?: Maybe<User>;
};


export type QueryGetFileVersionsArgs = {
	id: Scalars['ID'];
};


export type QueryGetLinkArgs = {
	node_id: Scalars['ID'];
};


export type QueryGetNodeArgs = {
	id: Scalars['ID'];
	version?: Maybe<Scalars['Int']>;
};


export type QueryGetShareArgs = {
	node_id: Scalars['ID'];
	target_user_id: Scalars['ID'];
};


export type QueryGetUserByEmailArgs = {
	email: Scalars['String'];
};


export type QueryGetUserByIdArgs = {
	id: Scalars['ID'];
};

/**  Definition of the Share type. It represents a share between a node and a user. */
export type Share = {
	__typename?: 'Share';
	/**  Share creation timestamp */
	created_at: Scalars['DateTime'];
	/**  Share expiration timestamp */
	expires_at?: Maybe<Scalars['DateTime']>;
	/**  Node shared */
	node: Node;
	/**  User permission for the node */
	permissions: Permissions;
	/**  User to whom a node has been shared */
	target_user: User;
};

export type Subscription = {
	__typename?: 'Subscription';
	nodeSubscription: NodeSubscription;
};


export type SubscriptionNodeSubscriptionArgs = {
	ids: Array<Maybe<Scalars['String']>>;
};

/**  Definition of the User type */
export type User = {
	__typename?: 'User';
	/**  Email of the user */
	email: Scalars['String'];
	/**  Full name of the user */
	full_name: Scalars['String'];
	/**  Univoque identifier of the folder */
	id: Scalars['ID'];
};

/**  Definition of the NodeSort enumerator. This is useful for sorting the result of a list of nodes. */
export enum NodeSort {
	LastEditorAsc = 'LAST_EDITOR_ASC',
	LastEditorDesc = 'LAST_EDITOR_DESC',
	MarkForDeletionAsc = 'MARK_FOR_DELETION_ASC',
	MarkForDeletionDesc = 'MARK_FOR_DELETION_DESC',
	NameAsc = 'NAME_ASC',
	NameDesc = 'NAME_DESC',
	OwnerAsc = 'OWNER_ASC',
	OwnerDesc = 'OWNER_DESC',
	TypeAsc = 'TYPE_ASC',
	TypeDesc = 'TYPE_DESC',
	UpdatedAtAsc = 'UPDATED_AT_ASC',
	UpdatedAtDesc = 'UPDATED_AT_DESC'
}

/**  The SharePermissions enumerator represents the permissions of a node shared with a user */
export enum SharePermissions {
	ReadAndShare = 'READ_AND_SHARE',
	ReadAndWrite = 'READ_AND_WRITE',
	ReadOnly = 'READ_ONLY',
	ReadWriteAndShare = 'READ_WRITE_AND_SHARE'
}

/**  Definition of the ShareSort enumerator. This is useful for sorting the result of a list of shares. */
export enum ShareSort {
	CreationAsc = 'CREATION_ASC',
	CreationDesc = 'CREATION_DESC',
	ExpirationAsc = 'EXPIRATION_ASC',
	ExpirationDesc = 'EXPIRATION_DESC',
	/**  The order is ascending: this means that first are shown the shares with fewer permissions. */
	SharePermissionsAsc = 'SHARE_PERMISSIONS_ASC',
	/**  The order is discending: this means that first are shown the shares with more permissions. */
	SharePermissionsDesc = 'SHARE_PERMISSIONS_DESC',
	/**  The order is based on the target user identifier and not on his email or display name. */
	TargetUserAsc = 'TARGET_USER_ASC',
	/**  The order is based on the target user identifier and not on his email or display name. */
	TargetUserDesc = 'TARGET_USER_DESC'
}

export type NodeInput = {
	node_id: Scalars['ID'];
	version?: Maybe<Scalars['Int']>;
};

