# Iowa Gambling Task Application
This application is a specialized version of the Iowa Gambling Task (IGT), designed to study decision-making under environmental and digital distractions. It is built with React and containerized using Docker.

## Running the project

### Build the image

To build the docker image, run this command in the root directory of the project:

```bash
docker build -t igt-image .
```

### Load the image

If the .tar file of the image is already given, you can load the image into your machine using the following command:

```bash
docker load -i igt-image.tar
```

### Running the image

Once the image is created or loaded into the system, use the following command to start the application:

```bash
docker run -d -p <local_port>:80 -p 3000:3000 --env-file app.env -v <results_folder>:/app/results --name igt-app igt-image
```

Keeping in mind the following parameters:
* `<local_port>`: This is the port where the application will be executed in the local host.
* `<results_folder>`: Path to the folder where all the JSON files of the results will be saved.

To access the test, use any browser with the link (http://localhost:<local_port>), or for the version with distactions add the parameter v=2 to the link (http://localhost:<local_port>/?v=2).


### Contact
The institutions and research team involved with this project are:
    - Universitat Rovira i Virgili
    - TECNATOX - iTAKA Research Group
For more information use the following mail: luis.heredia@urv.cat