This is a theme template for Obsidian (https://obsidian.md).

# Obsidian Theme Template

This template provides a starting point for creating your own Obsidian theme. It includes the necessary files and structure to help you get started quickly.

## Highlights

- 🪄 Built with Vite, supporting real-time preview of the template effects.
- 💪 Supports the SCSS preprocessor, making it easy to write styles.
- 🗃️ Modular styling for convenient design and maintenance.
- 🫧 Supports the definition of information for the Style Settings plugin, automatically generating Style Settings configuration information in a modular way.
- 🏷️ Supports automatic publishing by creating tags.

## Getting Started

![img.png](assets/use-this-template.png)

1. **Create a new repository**: Click the "Use this template" button to create a new repository based on this template.
2. **Clone the repository**: Clone your new repository to your local machine using Git.
3. **Install dependencies**: Navigate to the cloned repository directory and run `npm install` to install the necessary dependencies.
4. **Fill in the theme information**:
   - Open `package.json` and fill in basic information such as the theme name, author, and description.
   - Open `src/css/license.css` and fill in the theme's license information.
   - If necessary, update the version information in `versions.json`.  
5. **Develop your theme**: Start modifying the CSS files in the `src/scss` directory to create your custom theme.
   - Use the `npm run dev` command to start the development server, so you can preview your theme changes in real-time.
   - Create a symbolic link to map the `test` directory to the `themes` directory in your Obsidian Vault for testing your theme in Obsidian.
   - If needed, you can modify the `.css.md` files in the `src/css/style-settings/` directory. They will generate configuration definitions for the Style Settings plugin for your theme.
   - Whenever you make changes to files in either the `src/scss` or `src/css/style-settings` directories, they will be automatically compiled into `theme.css` in the `test` directory (HMR).
6. **Build the theme**: Run `npm run build` to compile your SCSS files into CSS. This will generate the final theme files in root directory.


## Notes

- During development, it is recommended to use the `npm run dev` command to preview theme changes in real-time.
- The Style Settings configuration adopts a modular design. Each module consists of a `.css.md` file and a directory with the same name. The directory contains a set of configuration files. This theme template supports dynamically reading these configurations during development and compilation, but the final definition information for delivery will be generated based on the order of file names. Therefore, you can add a numeric prefix to each Section.
- The Style Settings plugin does not support refreshing the configuration panel via hot - reload. You can reload the repository in Obsidian or restart Obsidian to view changes in the configuration panel.

You can refer to more information in [the official documentation](https://docs.obsidian.md/Themes/App+themes/Build+a+theme)

## Q&A

### How to disable Style Settings definitions?

The theme template has Style Settings definitions enabled by default. If you don't need to use Style Settings, you can delete all `.css.md` files and their corresponding configuration directories in the `src/css/style-settings/` directory.

### How to Publish Your Theme

After running `npm run build`, the `theme.css` and `manifest.json` files will be generated in the root directory. Then you can proceed with the publishing process.

There are two methods for publishing:

1. **Manual Publishing**. Publish directly through the GitHub Web UI.
   - Create a new Release on GitHub and upload the `theme.css` and `manifest.json` files.
   - Make sure to include the version number and update details in the Release description.
   - After publishing, users can search for and install your theme through Obsidian's theme settings interface (assuming your theme is on the Obsidian theme gallery).
   - For the steps, please refer to [Obsidian's official theme template release steps](https://github.com/obsidianmd/obsidian-sample-theme?tab=readme-ov-file#steps-for-releasing-new-versions).
2. **Automatic Publishing**. Automatically publish using GitHub Actions. 
   - After you've built your theme, push it to the `main` branch of your GitHub repository and create a tag. GitHub Actions will then automatically run and publish the theme.
   - For specific steps, please refer to the [Obsidian official documentation](https://docs.obsidian.md/Themes/App+themes/Release+your+theme+with+GitHub+Actions).

### How to Modify the `versions.json` File

In most cases, you don't need to modify this file.

If subsequent versions of your theme require a newer version of Obsidian to achieve the best experience, you can modify this file. The format of the file is as follows:

```json
{
   "1.0.0": "0.16.0",
   "2.0.0": "1.0.0"
}
```

Please note that according to Obsidian's rules, the version numbers used as keys refer to the version numbers of your theme, and the version numbers used as values refer to the version numbers of Obsidian. So if the new version of your theme is only compatible with an Insider version of Obsidian, it's important to set this value accordingly. This will prevent users on older versions of Obsidian from updating to the newer version of your theme.

## Thanks

- [@obsidianmd](https://github.com/obsidianmd/) - I used the GitHub Actions script from Obsidian's official theme template.
- [@kepano and Minimal Theme](https://github.com/kepano/obsidian-minima) - I referred to @kepano's Issues template and SCSS directory structure.


## Contribute

One of the easiest ways to contribute is to participate in discussions and discuss issues. You can also contribute by submitting pull requests with code changes.

### License

[MIT](LICENSE)